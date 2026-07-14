import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateScenarioDto, MortgageScenarioQueryDto } from './dto/mortgage.dto';

@Injectable()
export class MortgageService {
  constructor(private prisma: PrismaService) {}

  async generateScenario(dto: GenerateScenarioDto) {
    const lease = await this.prisma.leaseAgreement.findUnique({
      where: { id: dto.leaseAgreementId },
      include: { property: true },
    });
    if (!lease) throw new NotFoundException('Lease agreement not found');

    const propertyValue =
      dto.propertyValueAtGeneration ?? Number(lease.monthlyRentAmount) * 200;

    const downPaymentPercent = dto.downPaymentPercent;
    const downPayment = propertyValue * (downPaymentPercent / 100);
    const loanAmount = propertyValue - downPayment;

    const interestRatePercent = dto.interestRatePercent ?? 6.5;
    const i = interestRatePercent / 100 / 12;
    const n = dto.loanTermMonths ?? 360;

    let monthlyAmortization: number;
    if (i === 0) {
      monthlyAmortization = loanAmount / n;
    } else {
      const pow = Math.pow(1 + i, n);
      monthlyAmortization = (loanAmount * (i * pow)) / (pow - 1);
    }

    const totalInterestPayable = monthlyAmortization * n - loanAmount;

    const scenario = await this.prisma.mortgageScenario.create({
      data: {
        leaseAgreementId: lease.id,
        propertyId: lease.propertyId,
        generatedForUserId: lease.tenantUserId,
        propertyValueAtGeneration: Number(propertyValue.toFixed(2)),
        downPaymentPercent: downPaymentPercent,
        loanAmount: Number(loanAmount.toFixed(2)),
        interestRatePercent: interestRatePercent,
        loanTermMonths: n,
        monthlyAmortization: Number(monthlyAmortization.toFixed(2)),
        totalInterestPayable: Number(totalInterestPayable.toFixed(2)),
        status: 'draft',
      },
    });

    const schedule: any[] = [];
    let beginningBalance = loanAmount;
    let cumulativeInterest = 0;

    for (let period = 1; period <= n; period++) {
      const interestPayment = beginningBalance * i;
      const principalPayment = monthlyAmortization - interestPayment;
      let endingBalance = beginningBalance - principalPayment;
      if (endingBalance < 0) endingBalance = 0;
      cumulativeInterest += interestPayment;

      schedule.push({
        mortgageScenarioId: scenario.id,
        periodNumber: period,
        beginningBalance: Number(beginningBalance.toFixed(2)),
        monthlyPayment: Number(monthlyAmortization.toFixed(2)),
        principalPayment: Number(principalPayment.toFixed(2)),
        interestPayment: Number(interestPayment.toFixed(2)),
        endingBalance: Number(endingBalance.toFixed(2)),
        cumulativeInterestPaid: Number(cumulativeInterest.toFixed(2)),
      });

      beginningBalance = endingBalance;
    }

    await this.prisma.mortgageAmortizationSchedule.createMany({
      data: schedule,
    });

    const firstPeriods = schedule.slice(0, 3);
    const lastPeriods = schedule.slice(-3);

    return {
      scenario,
      summary: {
        propertyValue: Number(propertyValue.toFixed(2)),
        downPayment: Number(downPayment.toFixed(2)),
        loanAmount: Number(loanAmount.toFixed(2)),
        monthlyAmortization: Number(monthlyAmortization.toFixed(2)),
        totalInterestPayable: Number(totalInterestPayable.toFixed(2)),
        periods: n,
      },
      firstPeriods,
      lastPeriods,
    };
  }

  async findByLease(leaseAgreementId: string) {
    return this.prisma.mortgageScenario.findMany({
      where: { leaseAgreementId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const scenario = await this.prisma.mortgageScenario.findUnique({
      where: { id },
      include: {
        leaseAgreement: true,
        property: true,
        generatedFor: true,
        amortizationSchedule: { orderBy: { periodNumber: 'asc' } },
      },
    });
    if (!scenario) throw new NotFoundException('Mortgage scenario not found');
    return scenario;
  }

  async findAll(query: MortgageScenarioQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.leaseAgreementId) where.leaseAgreementId = query.leaseAgreementId;

    const [data, total] = await Promise.all([
      this.prisma.mortgageScenario.findMany({
        where,
        skip,
        take: limit,
        include: { leaseAgreement: true, property: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mortgageScenario.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async remove(id: string) {
    const scenario = await this.prisma.mortgageScenario.findUnique({ where: { id } });
    if (!scenario) throw new NotFoundException('Mortgage scenario not found');
    await this.prisma.mortgageAmortizationSchedule.deleteMany({
      where: { mortgageScenarioId: id },
    });
    await this.prisma.mortgageScenario.delete({ where: { id } });
    return { deleted: true };
  }
}
