import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtoQueryDto } from './dto/rto.dto';

@Injectable()
export class RtoService {
  constructor(private prisma: PrismaService) {}

  async createFromLease(lease: {
    id: string;
    monthlyRentAmount: any;
  }) {
    const monthlyRent = Number(lease.monthlyRentAmount);
    const monthlyRentPortion = Number((monthlyRent * 0.7).toFixed(2));
    const monthlyEquityPortion = Number((monthlyRent * 0.3).toFixed(2));

    return this.prisma.rtoContract.create({
      data: {
        leaseAgreementId: lease.id,
        totalContractValue: 0,
        monthlyRentPortion,
        monthlyEquityPortion,
        status: 'active',
      },
    });
  }

  async findOneByLease(leaseAgreementId: string) {
    const contract = await this.prisma.rtoContract.findUnique({
      where: { leaseAgreementId },
    });
    if (!contract) throw new NotFoundException('RTO contract not found');
    return contract;
  }

  async findAll(query: RtoQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.propertyId) {
      where.leaseAgreement = { propertyId: query.propertyId };
    }

    const [data, total] = await Promise.all([
      this.prisma.rtoContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leaseAgreement: {
            include: {
              property: true,
              tenant: true,
            },
          },
        },
      }),
      this.prisma.rtoContract.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.rtoContract.findUnique({
      where: { id },
      include: {
        leaseAgreement: {
          include: {
            property: true,
            tenant: true,
          },
        },
        paymentAllocations: true,
        equityLedger: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!contract) throw new NotFoundException('RTO contract not found');
    return contract;
  }

  async getEquityLedger(contractId: string) {
    const contract = await this.prisma.rtoContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('RTO contract not found');

    return this.prisma.rtoEquityLedger.findMany({
      where: { rtoContractId: contractId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async recordPaymentAllocation(rentalPaymentId: string) {
    const existing = await this.prisma.rtoPaymentAllocation.findFirst({
      where: { rentalPaymentId },
    });
    if (existing) return existing;

    const payment = await this.prisma.rentalPayment.findUnique({
      where: { id: rentalPaymentId },
      include: { leaseAgreement: true },
    });
    if (!payment || !payment.leaseAgreement) return null;

    const lease = payment.leaseAgreement;
    if (lease.leaseType !== 'rent_to_own') return null;

    const contract = await this.prisma.rtoContract.findUnique({
      where: { leaseAgreementId: lease.id },
    });
    if (
      !contract ||
      (contract.status !== 'active' && contract.status !== 'grace_period')
    )
      return null;

    const amountPaid = Number(payment.amountPaid) || 0;
    const rentPortionTotal =
      Number(contract.monthlyRentPortion) +
      Number(contract.monthlyEquityPortion);
    const rentPortion =
      rentPortionTotal > 0
        ? Number(
            (amountPaid * (Number(contract.monthlyRentPortion) / rentPortionTotal)).toFixed(2),
          )
        : 0;
    const equityPortion = Number((amountPaid - rentPortion).toFixed(2));

    const allocation = await this.prisma.rtoPaymentAllocation.create({
      data: {
        rentalPaymentId,
        rtoContractId: contract.id,
        rentPortionAmount: rentPortion,
        equityPortionAmount: equityPortion,
        totalPaymentAmount: amountPaid,
      },
    });

    const latest = await this.prisma.rtoEquityLedger.findFirst({
      where: { rtoContractId: contract.id },
      orderBy: { createdAt: 'desc' },
    });
    const prevBalance = latest ? Number(latest.runningBalance) : 0;
    const newBalance = Number((prevBalance + equityPortion).toFixed(2));

    await this.prisma.rtoEquityLedger.create({
      data: {
        rtoContractId: contract.id,
        transactionType: 'payment_credit',
        amount: equityPortion,
        runningBalance: newBalance,
        reference: rentalPaymentId,
      },
    });

    await this.prisma.rtoContract.update({
      where: { id: contract.id },
      data: { accumulatedEquity: newBalance },
    });

    return allocation;
  }

  async checkDefaultStatus(contractId?: string) {
    const where: any = { status: { in: ['active', 'grace_period'] } };
    if (contractId) where.id = contractId;

    const contracts = await this.prisma.rtoContract.findMany({
      where,
      include: {
        leaseAgreement: { include: { rentalPayments: true } },
      },
    });

    const defaulted: string[] = [];
    const gracePeriod: string[] = [];
    const now = new Date();

    for (const contract of contracts) {
      const lease = contract.leaseAgreement;
      const gracePeriodDays = lease.gracePeriodDays ?? 3;

      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - gracePeriodDays);

      const rentalPayments = lease.rentalPayments || [];
      const missedCount = rentalPayments.filter((p) => {
        const isUnpaid = p.status !== 'paid' && p.status !== 'partially_paid';
        if (!isUnpaid) return false;
        return new Date(p.dueDate) < threshold;
      }).length;

      const hasUnpaid = rentalPayments.some(
        (p) => p.status !== 'paid' && p.status !== 'partially_paid',
      );

      if (missedCount >= 1) {
        const latest = await this.prisma.rtoEquityLedger.findFirst({
          where: { rtoContractId: contract.id },
          orderBy: { createdAt: 'desc' },
        });
        const prevBalance = latest ? Number(latest.runningBalance) : 0;
        const forfeited = Number((prevBalance * 0.5).toFixed(2));
        const newBalance = Number((prevBalance - forfeited).toFixed(2));

        await this.prisma.rtoEquityLedger.create({
          data: {
            rtoContractId: contract.id,
            transactionType: 'forfeiture',
            amount: -forfeited,
            runningBalance: newBalance,
            notes: `Equity forfeiture of 50% due to default (${missedCount} missed payments beyond grace period)`,
          },
        });

        await this.prisma.rtoContract.update({
          where: { id: contract.id },
          data: { status: 'defaulted', accumulatedEquity: newBalance },
        });

        defaulted.push(contract.id);
      } else if (hasUnpaid && contract.status !== 'defaulted') {
        if (contract.status !== 'grace_period') {
          await this.prisma.rtoContract.update({
            where: { id: contract.id },
            data: { status: 'grace_period' },
          });
        }
        gracePeriod.push(contract.id);
      }
    }

    return {
      contractsChecked: contracts.length,
      defaulted,
      gracePeriod,
    };
  }

  async exerciseOption(contractId: string, userId: string) {
    const contract = await this.prisma.rtoContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('RTO contract not found');

    let newBalance = Number(contract.accumulatedEquity);

    if (contract.purchaseOptionPrice != null) {
      const credit = Number(contract.purchaseOptionPrice);
      newBalance = Number((newBalance + credit).toFixed(2));

      await this.prisma.rtoEquityLedger.create({
        data: {
          rtoContractId: contract.id,
          transactionType: 'option_fee_credit',
          amount: credit,
          runningBalance: newBalance,
          reference: userId,
          createdByUserId: userId,
          notes: 'Purchase option price credited upon exercising option',
        },
      });
    }

    return this.prisma.rtoContract.update({
      where: { id: contract.id },
      data: {
        isOptionExercised: true,
        exerciseDate: new Date(),
        status: 'exercised',
        accumulatedEquity: newBalance,
      },
    });
  }
}
