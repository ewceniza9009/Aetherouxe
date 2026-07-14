import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto, UpdateReminderDto, ReminderQueryDto } from './dto/payment-reminders.dto';

@Injectable()
export class PaymentRemindersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReminderDto) {
    const data: any = {
      type: dto.type,
      channel: dto.channel,
      scheduledAt: new Date(dto.scheduledAt),
      message: dto.message,
      status: 'pending',
    };
    if (dto.tenantId) data.tenantId = dto.tenantId;
    if (dto.ownerId) data.ownerId = dto.ownerId;
    if (dto.leaseId) data.leaseId = dto.leaseId;
    if (dto.rentalPaymentId) data.rentalPaymentId = dto.rentalPaymentId;

    return this.prisma.paymentReminder.create({ data });
  }

  async findAll(query: ReminderQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.leaseId) where.leaseId = query.leaseId;

    const [data, total] = await Promise.all([
      this.prisma.paymentReminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.paymentReminder.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { id },
      include: { lease: true, tenant: true, owner: true },
    });
    if (!reminder) throw new NotFoundException('Payment reminder not found');
    return reminder;
  }

  async update(id: string, dto: UpdateReminderDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.tenantId !== undefined) data.tenantId = dto.tenantId;
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId;
    if (dto.leaseId !== undefined) data.leaseId = dto.leaseId;
    if (dto.rentalPaymentId !== undefined) data.rentalPaymentId = dto.rentalPaymentId;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.channel !== undefined) data.channel = dto.channel;
    if (dto.scheduledAt !== undefined) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.message !== undefined) data.message = dto.message;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.paymentReminder.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.paymentReminder.delete({ where: { id } });
    return { deleted: true };
  }

  async generateForOverdue(tenantId?: string, leaseId?: string) {
    const now = new Date();
    const where: any = {
      dueDate: { lt: now },
      status: { in: ['pending', 'overdue', 'partially_paid'] },
    };
    if (leaseId) where.leaseAgreementId = leaseId;

    const payments = await this.prisma.rentalPayment.findMany({
      where,
      include: { leaseAgreement: { include: { property: true } } },
    });

    const created: any[] = [];
    for (const payment of payments) {
      const outstanding = Number(payment.amountDue) - Number(payment.amountPaid ?? 0);
      if (outstanding <= 0) continue;
      if (tenantId && payment.leaseAgreement?.property?.tenantId !== tenantId) continue;

      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - new Date(payment.dueDate).getTime()) / 86_400_000),
      );
      const message = `You have an overdue payment of ${outstanding.toFixed(2)} (${daysOverdue} days overdue). Please settle at your earliest convenience.`;

      const reminder = await this.prisma.paymentReminder.create({
        data: {
          tenantId: payment.leaseAgreement?.property?.tenantId,
          ownerId: undefined,
          leaseId: payment.leaseAgreementId,
          rentalPaymentId: payment.id,
          type: 'post_due',
          channel: 'portal',
          scheduledAt: now,
          message,
          status: 'pending',
        },
      });
      created.push(reminder);
    }

    return { count: created.length, reminders: created };
  }

  async findDue(now?: Date) {
    const asOf = now || new Date();
    return this.prisma.paymentReminder.findMany({
      where: { status: 'pending', scheduledAt: { lte: asOf } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async markSent(id: string) {
    await this.findOne(id);
    return this.prisma.paymentReminder.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }
}
