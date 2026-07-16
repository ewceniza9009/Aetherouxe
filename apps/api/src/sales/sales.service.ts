import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplySchemeDto, SalesSchemeType } from './dto/apply-scheme.dto';

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildAmortization(loanAmount: number, annualRatePct: number, n: number) {
  const i = annualRatePct / 100 / 12;
  const roundedPayment =
    i === 0
      ? round2(loanAmount / n)
      : round2((loanAmount * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
  const rows: any[] = [];
  let beginning = loanAmount;
  let cumInterest = 0;
  for (let p = 1; p <= n; p++) {
    const interest = round2(beginning * i);
    let principal: number;
    let payment: number;
    let ending: number;
    if (p === n) {
      principal = round2(beginning);
      payment = round2(interest + principal);
      ending = 0;
    } else {
      payment = roundedPayment;
      principal = round2(payment - interest);
      ending = round2(beginning - principal);
    }
      cumInterest = round2(cumInterest + interest);
      rows.push({
        periodNumber: p,
        beginningBalance: round2(beginning),
        monthlyPayment: payment,
        principalPayment: principal,
        interestPayment: interest,
        endingBalance: ending,
        cumulativeInterestPaid: cumInterest,
      });
    beginning = ending;
  }
  return { rows, monthly: roundedPayment, totalInterest: cumInterest };
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async applyScheme(dto: ApplySchemeDto, performedByUserId?: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { property: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (!unit.propertyId) throw new BadRequestException('Unit is not linked to a property');

    const buyer = await this.prisma.user.findUnique({ where: { id: dto.buyerUserId } });
    if (!buyer) throw new NotFoundException('Buyer/user not found');

    const tenantId = unit.property.tenantId;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + (dto.schemeType === SalesSchemeType.RENT_TO_OWN ? 5 : 1));

    const result: any = { schemeType: dto.schemeType, unitId: unit.id };

    // 1) Lease agreement (the backbone of every scheme)
    const lease = await this.prisma.leaseAgreement.create({
      data: {
        propertyId: unit.propertyId,
        unitId: unit.id,
        tenantUserId: buyer.id,
        unitLabel: unit.unitNumber,
        leaseType:
          dto.schemeType === SalesSchemeType.RENT_TO_OWN
            ? 'rent_to_own'
            : dto.schemeType === SalesSchemeType.LONG_TERM_RENTAL
            ? 'standard_rental'
            : 'standard_rental',
        startDate,
        endDate,
        monthlyRentAmount: dto.monthlyRentAmount ?? 0,
        isActive: true,
      },
    });
    result.leaseId = lease.id;

    // 2) Scheme-specific records
    if (dto.schemeType === SalesSchemeType.SALE_MORTGAGE) {
      const value = dto.totalContractValue ?? 0;
      const downPct = dto.downPaymentPercent ?? 20;
      const loanAmount = round2(value * (1 - downPct / 100));
      const rate = dto.interestRatePercent ?? 6.5;
      const term = dto.loanTermMonths ?? 360;
      const { rows, monthly, totalInterest } = buildAmortization(loanAmount, rate, term);
      const scenario = await this.prisma.mortgageScenario.create({
        data: {
          leaseAgreementId: lease.id,
          propertyId: unit.propertyId,
          generatedForUserId: buyer.id,
          propertyValueAtGeneration: value,
          downPaymentPercent: downPct,
          loanAmount,
          interestRatePercent: rate,
          loanTermMonths: term,
          monthlyAmortization: monthly,
          totalInterestPayable: totalInterest,
          status: 'presented',
        },
      });
      await this.prisma.mortgageAmortizationSchedule.createMany({
        data: rows.map((r) => ({ ...r, mortgageScenarioId: scenario.id })),
      });
      result.mortgageScenarioId = scenario.id;

      // Auto invoice: down payment (reservation of the sale)
      const downPayment = round2(value * (downPct / 100));
      result.invoice = await this.createInvoice(
        tenantId,
        buyer.id,
        downPayment,
        startDate,
        'downpayment',
        `Down payment (${downPct}%) for ${unit.unitNumber}`,
        lease.id,
      );
    } else if (dto.schemeType === SalesSchemeType.RENT_TO_OWN) {
      const value = dto.totalContractValue ?? 0;
      const monthlyRent = dto.monthlyRentAmount ?? 0;
      const equityPortion = round2(monthlyRent * 0.3);
      const rentPortion = round2(monthlyRent - equityPortion);
      const rto = await this.prisma.rtoContract.create({
        data: {
          leaseAgreementId: lease.id,
          totalContractValue: value,
          optionFeeAmount: dto.optionFeeAmount ?? round2(value * 0.02),
          monthlyRentPortion: rentPortion,
          monthlyEquityPortion: equityPortion,
          accumulatedEquity: 0,
          targetPurchaseDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
          purchaseOptionPrice: value,
          status: 'active',
        },
      });
      // Seed initial equity ledger entry (option fee credited as equity)
      const optionFee = dto.optionFeeAmount ?? round2(value * 0.02);
      await this.prisma.rtoEquityLedger.create({
        data: {
          rtoContractId: rto.id,
          transactionType: 'option_fee',
          amount: optionFee,
          runningBalance: optionFee,
          reference: `RTO-INIT-${rto.id.slice(0, 8).toUpperCase()}`,
          createdByUserId: performedByUserId,
        },
      });
      await this.prisma.rtoContract.update({
        where: { id: rto.id },
        data: { accumulatedEquity: optionFee },
      });
      result.rtoContractId = rto.id;

      result.invoice = await this.createInvoice(
        tenantId,
        buyer.id,
        optionFee,
        startDate,
        'reservation',
        `RTO option fee for ${unit.unitNumber}`,
        lease.id,
      );
    } else if (dto.schemeType === SalesSchemeType.RESERVATION) {
      const fee = dto.optionFeeAmount ?? 25000;
      result.invoice = await this.createInvoice(
        tenantId,
        buyer.id,
        fee,
        startDate,
        'reservation',
        `Reservation fee for ${unit.unitNumber}`,
        lease.id,
      );
    }
    // LONG_TERM_RENTAL: lease only, no invoice/equity (recurring rent handled elsewhere)

    return result;
  }

  private async createInvoice(
    tenantId: string,
    userId: string,
    amount: number,
    issued: Date,
    type: string,
    notes: string,
    leaseId?: string,
  ) {
    const due = new Date(issued);
    due.setDate(due.getDate() + 15);
    const year = new Date().getFullYear();
    const seq = Math.floor(1000 + Math.random() * 9000);
    return this.prisma.arInvoice.create({
      data: {
        tenantId,
        userId,
        invoiceType: type as any,
        referenceSource: leaseId ? `lease:${leaseId}` : undefined,
        invoiceNumber: `INV-${year}-${seq}`,
        amount,
        dueDate: due,
        status: 'pending',
        issuedDate: issued,
        notes,
      },
    });
  }
}
