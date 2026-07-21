import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtoService } from '../rto/rto.service';
import {
  CreateRentalPaymentDto,
  RecordPaymentDto,
  RentalPaymentQueryDto,
} from './dto/rental-payments.dto';

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
    const existing = await this.prisma.rentalPayment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rental payment not found');

    const lease = await this.prisma.leaseAgreement.findUnique({
      where: { id: existing.leaseAgreementId },
      include: { property: true },
    });

    const amountDue = Number(existing.amountDue);
    const newAmountPaid = Number(existing.amountPaid ?? 0) + Number(dto.amountPaid);
    const dueDate = new Date(existing.dueDate);
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : undefined;

    let status: string;
    if (newAmountPaid >= amountDue) status = 'paid';
    else if (newAmountPaid > 0) status = 'partially_paid';
    else status = 'pending';
    const lateFeeApplied = paymentDate ? paymentDate > dueDate : existing.lateFeeApplied;

    const updated = await this.prisma.rentalPayment.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        paymentDate,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        status,
        lateFeeApplied,
      },
    });

    // Record General Ledger posting for paid rental amount
    if (Number(dto.amountPaid) > 0 && lease) {
      const cashAcc = await this.prisma.chartOfAccount.findFirst({
        where: { tenantId: lease.property.tenantId, accountCode: '1000' },
      });
      const rentAcc = await this.prisma.chartOfAccount.findFirst({
        where: { tenantId: lease.property.tenantId, accountCode: '4000' },
      });
      if (cashAcc && rentAcc) {
        await this.prisma.journalEntry.create({
          data: {
            tenantId: lease.property.tenantId,
            reference: dto.paymentReference ?? `PAY-${updated.id.slice(0, 8)}`,
            notes: `Rental payment recorded for lease ${lease.id.slice(0, 8)}`,
            lines: {
              create: [
                {
                  accountId: cashAcc.id,
                  debitAmount: Number(dto.amountPaid),
                  description: 'Cash received',
                },
                {
                  accountId: rentAcc.id,
                  creditAmount: Number(dto.amountPaid),
                  description: 'Rental Income',
                },
              ],
            },
          },
        });
      }
    }

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

    try {
      const allocation = await this.prisma.rtoPaymentAllocation.findFirst({
        where: { rentalPaymentId: id },
      });

      if (allocation) {
        const contract = await this.prisma.rtoContract.findUnique({
          where: { id: allocation.rtoContractId },
        });

        if (contract) {
          const latest = await this.prisma.rtoEquityLedger.findFirst({
            where: { rtoContractId: contract.id },
            orderBy: { createdAt: 'desc' },
          });
          const prevBalance = latest ? Number(latest.runningBalance) : 0;
          const reverseAmount = -Number(allocation.equityPortionAmount);
          const newBalance = Number((prevBalance + reverseAmount).toFixed(2));

          await this.prisma.rtoEquityLedger.create({
            data: {
              rtoContractId: contract.id,
              transactionType: 'adjustment',
              amount: reverseAmount,
              runningBalance: newBalance,
              reference: id,
              notes: 'Equity reversal on rental payment removal',
            },
          });

          await this.prisma.rtoContract.update({
            where: { id: contract.id },
            data: { accumulatedEquity: newBalance },
          });
        }

        await this.prisma.rtoPaymentAllocation.delete({ where: { id: allocation.id } });
      }
    } catch {
      // safe: still delete the payment even if equity reversal fails
    }

    await this.prisma.rentalPayment.delete({ where: { id } });
    return { deleted: true };
  }
}
