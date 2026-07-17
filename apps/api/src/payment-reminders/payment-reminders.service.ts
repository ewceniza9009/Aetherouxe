import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto, UpdateReminderDto, ReminderQueryDto } from './dto/payment-reminders.dto';

const REMINDER_INCLUDE = {
  tenant: true,
  owner: true,
  lease: { include: { tenant: true, property: true } },
  rentalPayment: true,
} as const;

@Injectable()
export class PaymentRemindersService {
  constructor(private prisma: PrismaService) {}

  private serialize(reminder: any) {
    if (!reminder) return reminder;
    const leaseUser = reminder.lease?.tenant;
    const owner = reminder.owner;
    let recipientName: string | null = null;
    let recipientEmail: string | null = null;

    if (leaseUser) {
      recipientName =
        [leaseUser.firstName, leaseUser.lastName].filter(Boolean).join(' ').trim() ||
        leaseUser.email ||
        null;
      recipientEmail = leaseUser.email ?? null;
    } else if (owner) {
      recipientName =
        [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim() ||
        owner.email ||
        null;
      recipientEmail = owner.email ?? null;
    } else if (reminder.tenant?.name) {
      recipientName = reminder.tenant.name;
    }

    return {
      ...reminder,
      recipientName: recipientName ?? 'Unknown recipient',
      recipientEmail,
    };
  }

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

    const created = await this.prisma.paymentReminder.create({
      data,
      include: REMINDER_INCLUDE,
    });
    return this.serialize(created);
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
        include: REMINDER_INCLUDE,
      }),
      this.prisma.paymentReminder.count({ where }),
    ]);

    return {
      data: data.map((r) => this.serialize(r)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { id },
      include: REMINDER_INCLUDE,
    });
    if (!reminder) throw new NotFoundException('Payment reminder not found');
    return this.serialize(reminder);
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

    const updated = await this.prisma.paymentReminder.update({
      where: { id },
      data,
      include: REMINDER_INCLUDE,
    });
    return this.serialize(updated);
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
      include: { leaseAgreement: { include: { property: true, tenant: true } } },
    });

    const created: any[] = [];
    for (const payment of payments) {
      const outstanding = Number(payment.amountDue) - Number(payment.amountPaid ?? 0);
      if (outstanding <= 0) continue;
      const recipientUserId = payment.leaseAgreement?.tenantUserId;
      if (tenantId && recipientUserId !== tenantId) continue;
      if (!recipientUserId) continue;

      const existing = await this.prisma.paymentReminder.findFirst({
        where: {
          rentalPaymentId: payment.id,
          type: 'post_due',
          status: 'pending',
        },
      });
      if (existing) continue;

      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - new Date(payment.dueDate).getTime()) / 86_400_000),
      );
      const message = `You have an overdue payment of ${outstanding.toFixed(2)} (${daysOverdue} days overdue). Please settle at your earliest convenience.`;

      const reminder = await this.prisma.paymentReminder.create({
        data: {
          ownerId: recipientUserId,
          leaseId: payment.leaseAgreementId,
          rentalPaymentId: payment.id,
          type: 'post_due',
          channel: 'portal',
          scheduledAt: now,
          message,
          status: 'pending',
        },
        include: REMINDER_INCLUDE,
      });
      created.push(this.serialize(reminder));
    }

    return { count: created.length, generated: created.length, reminders: created };
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
    const updated = await this.prisma.paymentReminder.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
      include: REMINDER_INCLUDE,
    });
    return this.serialize(updated);
  }
}
