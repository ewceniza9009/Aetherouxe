import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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

    // Validate inputs
    if (dto.downPaymentPercent <= 0 || dto.downPaymentPercent >= 100) {
      throw new BadRequestException('Down payment percent must be between 1 and 99');
    }
    if (dto.loanTermMonths !== undefined && dto.loanTermMonths <= 0) {
      throw new BadRequestException('Loan term must be at least 1 month');
    }
    if (dto.interestRatePercent !== undefined && dto.interestRatePercent < 0) {
      throw new BadRequestException('Interest rate cannot be negative');
    }

    // Duplicate guard: reject if an active scenario already exists for this lease
    const existingActive = await this.prisma.mortgageScenario.findFirst({
      where: {
        leaseAgreementId: dto.leaseAgreementId,
        status: { in: ['draft', 'presented', 'tenant_interested', 'approved'] },
      },
    });
    if (existingActive) {
      throw new ConflictException(
        `Active mortgage scenario already exists for this lease (status: ${existingActive.status}). Delete or reject it first.`,
      );
    }

    const propertyValue =
      dto.propertyValueAtGeneration ?? Number(lease.monthlyRentAmount) * 200;

    if (propertyValue <= 0) {
      throw new BadRequestException('Property value must be positive. Provide propertyValueAtGeneration or set a monthly rent on the lease.');
    }

    const downPaymentPercent = dto.downPaymentPercent;
    const downPayment = propertyValue * (downPaymentPercent / 100);
    const loanAmount = propertyValue - downPayment;

    if (loanAmount <= 0) {
      throw new BadRequestException('Loan amount must be positive. Adjust the down payment percent or property value.');
    }

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

    const roundedPayment = Number(monthlyAmortization.toFixed(2));
    const totalInterestPayable = roundedPayment * n - loanAmount;

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
        monthlyAmortization: roundedPayment,
        totalInterestPayable: Number(totalInterestPayable.toFixed(2)),
        status: 'draft',
      },
    });

    const schedule: any[] = [];
    let beginningBalance = loanAmount;
    let cumulativeInterest = 0;
    let interestRowSum = 0;
    const leaseStart = new Date(lease.startDate);

    for (let period = 1; period <= n; period++) {
      const interestPayment = Number((beginningBalance * i).toFixed(2));
      let principalPayment: number;
      let endingBalance: number;
      let monthlyPayment: number;

      if (period === n) {
        principalPayment = Number(beginningBalance.toFixed(2));
        endingBalance = 0;
        monthlyPayment = Number((interestPayment + principalPayment).toFixed(2));
      } else {
        principalPayment = Number((roundedPayment - interestPayment).toFixed(2));
        endingBalance = Number((beginningBalance - principalPayment).toFixed(2));
        monthlyPayment = roundedPayment;
      }

      cumulativeInterest += interestPayment;
      interestRowSum += interestPayment;

      const periodDate = new Date(leaseStart);
      periodDate.setMonth(periodDate.getMonth() + (period - 1));

      schedule.push({
        mortgageScenarioId: scenario.id,
        periodNumber: period,
        periodDate,
        beginningBalance: Number(beginningBalance.toFixed(2)),
        monthlyPayment,
        principalPayment,
        interestPayment,
        endingBalance,
        cumulativeInterestPaid: Number(cumulativeInterest.toFixed(2)),
      });

      beginningBalance = endingBalance;
    }

    const finalTotalInterest = Number(interestRowSum.toFixed(2));
    if (finalTotalInterest !== Number(totalInterestPayable.toFixed(2))) {
      await this.prisma.mortgageScenario.update({
        where: { id: scenario.id },
        data: { totalInterestPayable: finalTotalInterest },
      });
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

  async updateStatus(id: string, status: string) {
    const allowed = ['draft', 'presented', 'tenant_interested', 'approved', 'rejected', 'expired'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${allowed.join(', ')}`);
    }
    const scenario = await this.prisma.mortgageScenario.findUnique({ where: { id } });
    if (!scenario) throw new NotFoundException('Mortgage scenario not found');
    return this.prisma.mortgageScenario.update({
      where: { id },
      data: { status },
    });
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
