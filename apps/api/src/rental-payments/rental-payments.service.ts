import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtoService } from '../rto/rto.service';
import { CreateRentalPaymentDto, RecordPaymentDto, RentalPaymentQueryDto } from './dto/rental-payments.dto';

@Injectable()
export class RentalPaymentsService {
  constructor(
    private prisma: PrismaService,
    private rtoService: RtoService,
  ) {}

  async create(dto: CreateRentalPaymentDto) {
    const lease = await this.prisma.leaseAgreement.findUnique({
      where: { id: dto.leaseAgreementId },
    });
    if (!lease) throw new NotFoundException('Lease agreement not found');

    return this.prisma.rentalPayment.create({
      data: {
        leaseAgreementId: dto.leaseAgreementId,
        billingPeriodStart: new Date(dto.billingPeriodStart),
        billingPeriodEnd: new Date(dto.billingPeriodEnd),
        dueDate: new Date(dto.dueDate),
        amountDue: dto.amountDue,
        amountPaid: 0,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        status: 'pending',
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.rentalPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Rental payment not found');
    return payment;
  }

  async findByLease(leaseAgreementId: string) {
    return this.prisma.rentalPayment.findMany({
      where: { leaseAgreementId },
      orderBy: { billingPeriodStart: 'asc' },
    });
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const payment = await this.prisma.rentalPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Rental payment not found');

    const lease = await this.prisma.leaseAgreement.findUnique({
      where: { id: payment.leaseAgreementId },
    });

    const amountDue = Number(payment.amountDue);
    const amountPaid = Number(dto.amountPaid);
    const dueDate = new Date(payment.dueDate);
    const paymentDate = new Date(dto.paymentDate);

    const isPaid = amountPaid >= amountDue;
    const status = isPaid ? 'paid' : 'partially_paid';
    const lateFeeApplied = paymentDate > dueDate;

    const updated = await this.prisma.rentalPayment.update({
      where: { id },
      data: {
        amountPaid,
        paymentDate,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        status,
        lateFeeApplied,
      },
    });

    if (lease?.leaseType === 'rent_to_own') {
      await this.rtoService.recordPaymentAllocation(updated.id);
    }

    return updated;
  }

  async findAll(query: RentalPaymentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.leaseAgreementId) where.leaseAgreementId = query.leaseAgreementId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.rentalPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { billingPeriodStart: 'asc' },
      }),
      this.prisma.rentalPayment.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async remove(id: string) {
    const payment = await this.prisma.rentalPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Rental payment not found');
    await this.prisma.rentalPayment.delete({ where: { id } });
    return { deleted: true };
  }
}
