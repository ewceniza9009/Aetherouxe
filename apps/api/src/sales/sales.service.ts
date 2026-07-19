import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplySchemeDto } from './dto/apply-scheme.dto';
import { SchemeListItem } from '@elite-realty/shared-types';
import { CodeSequenceService } from '../code-sequence/code-sequence.service';

const round2 = (n: number) => Math.round(n * 100) / 100;
const nnum = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeSequence: CodeSequenceService,
  ) {}

  async applyScheme(dto: ApplySchemeDto, performedByUserId?: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { property: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (!unit.propertyId) throw new BadRequestException('Unit is not linked to a property');

    const buyer = await this.prisma.user.findUnique({ where: { id: dto.buyerUserId } });
    if (!buyer) throw new NotFoundException('Buyer/user not found');

    const agent = (await this.prisma.realEstateAgent.findUnique({
      where: { id: dto.agentId },
      include: { user: true },
    })) as any;
    if (!agent) throw new NotFoundException('Agent not found');

    const scheme = await this.prisma.scheme.findUnique({ where: { id: dto.schemeId } });
    if (!scheme) throw new NotFoundException('Scheme template not found');
    if (!scheme.isActive) throw new BadRequestException('Scheme template is inactive');

    const tenantId = unit.property!.tenantId;
    const value = dto.totalContractValue ?? 0;
    if (scheme.schemeType !== 'standard_rental' && scheme.schemeType !== 'rent_to_own') {
      if (!value || value <= 0) {
        throw new BadRequestException('totalContractValue is required for this scheme type');
      }
    }

    const existingLease = await this.prisma.leaseAgreement.findFirst({
      where: { tenantUserId: buyer.id, unitId: unit.id, isActive: true },
    });
    if (existingLease) {
      throw new BadRequestException(
        `Active lease already exists for this buyer on unit ${unit.unitNumber}.`,
      );
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    const termYears =
      scheme.schemeType === 'rent_to_own' ? nnum(scheme.targetPurchaseYears) || 5 : 1;
    endDate.setFullYear(endDate.getFullYear() + termYears);

    const result: any = {
      schemeType: scheme.schemeType,
      schemeId: scheme.id,
      schemeCode: scheme.code,
      schemeName: scheme.name,
      unitId: unit.id,
      unitLabel: unit.unitNumber,
      propertyId: unit.propertyId!,
      propertyName: (unit.property as any)?.propertyCode ?? '—',
      buyerName: [buyer.firstName, buyer.lastName].filter(Boolean).join(' ') || buyer.email,
      agentName: agent.user?.firstName
        ? [agent.user.firstName, agent.user.lastName].filter(Boolean).join(' ')
        : agent.userId,
    };

    return this.prisma.$transaction(async (tx) => {
      // ── 1. Create LeaseAgreement ──
      const lease = await tx.leaseAgreement.create({
        data: {
          propertyId: unit.propertyId!,
          unitId: unit.id,
          tenantUserId: buyer.id,
          agentId: agent.id,
          schemeId: scheme.id,
          unitLabel: unit.unitNumber,
          leaseType: this.mapLeaseType(scheme.schemeType) as any,
          schemeType: scheme.schemeType,
          startDate,
          endDate,
          monthlyRentAmount: dto.monthlyRentAmount ?? 0,
          latePaymentPenaltyPercent: scheme.penaltyPercent ?? undefined,
          gracePeriodDays: scheme.graceDays ?? 3,
          isActive: true,
        },
      });
      result.leaseId = lease.id;

      // ── 2. Generate invoices based on scheme type ──
      switch (scheme.schemeType) {
        case 'installment':
          await this.generateInstallmentInvoices(
            tx,
            scheme,
            lease,
            unit,
            value,
            startDate,
            tenantId,
            buyer.id,
            result,
          );
          break;
        case 'mortgage_assisted':
          await this.generateMortgageInvoices(
            tx,
            scheme,
            lease,
            unit,
            dto,
            value,
            startDate,
            tenantId,
            buyer.id,
            result,
          );
          break;
        case 'rent_to_own':
          await this.generateRtoRecords(
            tx,
            scheme,
            lease,
            unit,
            dto,
            value,
            startDate,
            tenantId,
            buyer.id,
            performedByUserId,
            result,
          );
          break;
        case 'spot_cash':
          await this.generateSpotCashInvoice(
            tx,
            scheme,
            lease,
            unit,
            value,
            startDate,
            tenantId,
            buyer.id,
            result,
          );
          break;
        case 'standard_rental':
          // No invoice at application time — monthly billing handled separately
          result.note = 'Lease created. Monthly billing is generated separately.';
          break;
      }

      // ── 3. Create Agent Transaction (commission) ──
      const commissionPct = nnum(scheme.agentCommissionPercentage);
      if (commissionPct > 0 && value > 0) {
        const calculatedCommission = round2(value * (commissionPct / 100));
        const agentTx = await tx.agentTransaction.create({
          data: {
            agentId: agent.id,
            transactionType: this.mapTransactionType(scheme.schemeType) as any,
            propertyId: unit.propertyId!,
            leaseAgreementId: lease.id,
            transactionAmount: value,
            calculatedCommission,
            finalCommission: calculatedCommission,
            status: 'pending',
            transactionDate: new Date(),
          },
        });
        result.agentTransaction = {
          id: agentTx.id,
          calculatedCommission,
          commissionPercent: commissionPct,
          status: 'pending',
        };
      }

      // ── 4. GL Integration (Sales/Receivables) ──
      const isSale = ['spot_cash', 'installment', 'mortgage_assisted'].includes(scheme.schemeType);
      if (isSale && value > 0) {
        const mapping = await tx.financialMapping.findFirst({
          where: { tenantId, transactionType: 'SALE_CONTRACT_SIGNED' },
        });
        if (mapping && mapping.debitAccountId && mapping.creditAccountId) {
          await tx.journalEntry.create({
            data: {
              tenantId,
              reference: `SALE-${lease.id.substring(0, 8)}`,
              notes: `Sale Contract Signed for unit ${unit.unitNumber} (${scheme.schemeType})`,
              lines: {
                create: [
                  {
                    accountId: mapping.debitAccountId,
                    debitAmount: value,
                    description: 'Accounts Receivable',
                  },
                  {
                    accountId: mapping.creditAccountId,
                    creditAmount: value,
                    description: 'Sales Income',
                  },
                ],
              },
            },
          });
        }
      }

      return result;
    });
  }

  private mapLeaseType(schemeType: string): string {
    switch (schemeType) {
      case 'rent_to_own':
        return 'rent_to_own';
      case 'corporate_lease':
        return 'corporate_lease';
      default:
        return 'standard_rental';
    }
  }

  private mapTransactionType(schemeType: string): string {
    switch (schemeType) {
      case 'rent_to_own':
        return 'rto_contract';
      case 'standard_rental':
        return 'rental_lease';
      default:
        return 'sale';
    }
  }

  // ── Installment: DP + EQ + BL invoice schedule ──
  private async generateInstallmentInvoices(
    tx: any,
    scheme: any,
    lease: any,
    unit: any,
    value: number,
    startDate: Date,
    tenantId: string,
    buyerId: string,
    result: any,
  ) {
    const invoices: any[] = [];

    // Down Payment phase
    const dpPayments = nnum(scheme.dpNumberOfPayments);
    const dpAmount = nnum(scheme.dpAmount);
    const dpTotal =
      dpAmount > 0
        ? dpAmount
        : round2((value * (nnum(scheme.eqDownpaymentPercentage) || 20)) / 100);
    if (dpPayments > 0 && dpTotal > 0) {
      const dpPerMonth = round2(dpTotal / dpPayments);
      for (let i = 0; i < dpPayments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        const inv = await this.createInvoice(
          tx,
          tenantId,
          buyerId,
          dpPerMonth,
          dueDate,
          'downpayment',
          `DP installment ${i + 1}/${dpPayments} for ${unit.unitNumber}`,
          lease.id,
        );
        invoices.push(inv);
      }
    }

    // Equity phase
    const eqPayments = nnum(scheme.eqNumberOfPayments);
    const eqAmount = nnum(scheme.eqAmount);
    const eqPct = nnum(scheme.eqPaymentPercentage);
    const eqTotal = eqAmount > 0 ? eqAmount : eqPct > 0 ? round2((value * eqPct) / 100) : 0;
    if (eqPayments > 0 && eqTotal > 0) {
      const eqPerMonth = round2(eqTotal / eqPayments);
      const eqStart = new Date(startDate);
      eqStart.setMonth(eqStart.getMonth() + dpPayments + 1);
      for (let i = 0; i < eqPayments; i++) {
        const dueDate = new Date(eqStart);
        dueDate.setMonth(dueDate.getMonth() + i);
        const inv = await this.createInvoice(
          tx,
          tenantId,
          buyerId,
          eqPerMonth,
          dueDate,
          'equity_credit',
          `EQ installment ${i + 1}/${eqPayments} for ${unit.unitNumber}`,
          lease.id,
        );
        invoices.push(inv);
      }
    }

    // Balance phase (single invoice or installments)
    const blPayments = nnum(scheme.blNumberOfPayments);
    const blAmount = nnum(scheme.blAmount);
    const blPct = nnum(scheme.blPaymentPercentage);
    const blTotal = blAmount > 0 ? blAmount : blPct > 0 ? round2((value * blPct) / 100) : 0;
    if (blTotal > 0) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + dpPayments + eqPayments + 1);
      const inv = await this.createInvoice(
        tx,
        tenantId,
        buyerId,
        blTotal,
        dueDate,
        'downpayment',
        `Balance payment for ${unit.unitNumber}`,
        lease.id,
      );
      invoices.push(inv);
    }

    result.invoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      type: inv.invoiceType,
      dueDate: inv.dueDate,
    }));
  }

  // ── Mortgage Assisted: DP in-house + bank financing ──
  private async generateMortgageInvoices(
    tx: any,
    scheme: any,
    lease: any,
    unit: any,
    dto: ApplySchemeDto,
    value: number,
    startDate: Date,
    tenantId: string,
    buyerId: string,
    result: any,
  ) {
    // DP phase (if scheme has DP installments)
    const dpPayments = nnum(scheme.dpNumberOfPayments);
    const dpPct = dto.downPaymentPercent ?? nnum(scheme.mortgageDownPaymentPercent) ?? 20;
    const dpTotal = round2((value * dpPct) / 100);

    if (dpPayments > 0 && dpTotal > 0) {
      const dpPerMonth = round2(dpTotal / dpPayments);
      const invoices: any[] = [];
      for (let i = 0; i < dpPayments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        const inv = await this.createInvoice(
          tx,
          tenantId,
          buyerId,
          dpPerMonth,
          dueDate,
          'downpayment',
          `DP installment ${i + 1}/${dpPayments} for ${unit.unitNumber}`,
          lease.id,
        );
        invoices.push(inv);
      }
      result.dpInvoices = invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.amount),
      }));
    } else if (dpTotal > 0) {
      // Single DP invoice
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + 15);
      const inv = await this.createInvoice(
        tx,
        tenantId,
        buyerId,
        dpTotal,
        dueDate,
        'downpayment',
        `Down payment (${dpPct}%) for ${unit.unitNumber}`,
        lease.id,
      );
      result.dpInvoice = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.amount),
      };
    }

    // Bank mortgage scenario
    const loanAmount = round2(value - dpTotal);
    if (loanAmount > 0) {
      const rate = dto.interestRatePercent ?? nnum(scheme.interestRatePercent) ?? 6.5;
      const term = dto.loanTermMonths ?? nnum(scheme.loanTermMonths) ?? 360;
      const { rows, monthly, totalInterest } = buildAmortization(loanAmount, rate, term);

      const scenario = await tx.mortgageScenario.create({
        data: {
          leaseAgreementId: lease.id,
          propertyId: unit.propertyId,
          generatedForUserId: buyerId,
          propertyValueAtGeneration: value,
          downPaymentPercent: dpPct,
          loanAmount,
          interestRatePercent: rate,
          loanTermMonths: term,
          monthlyAmortization: monthly,
          totalInterestPayable: totalInterest,
          status: 'presented',
        },
      });

      await tx.mortgageAmortizationSchedule.createMany({
        data: rows.map((r) => ({
          ...r,
          mortgageScenarioId: scenario.id,
          periodDate: new Date(
            new Date(startDate).setMonth(startDate.getMonth() + (r.periodNumber - 1)),
          ),
        })),
      });

      result.mortgageScenarioId = scenario.id;
      result.mortgage = {
        loanAmount,
        monthlyAmortization: monthly,
        totalInterest,
        periods: term,
      };
    }
  }

  // ── Rent-to-Own: option fee + equity accumulation ──
  private async generateRtoRecords(
    tx: any,
    scheme: any,
    lease: any,
    unit: any,
    dto: ApplySchemeDto,
    value: number,
    startDate: Date,
    tenantId: string,
    buyerId: string,
    performedByUserId: string | undefined,
    result: any,
  ) {
    const monthlyRent = dto.monthlyRentAmount ?? nnum(lease.monthlyRentAmount);
    if (monthlyRent <= 0) {
      throw new BadRequestException('monthlyRentAmount is required for rent-to-own');
    }

    const eqAccumPct = nnum(scheme.equityAccumulationPercent) || 30;
    const equityPortion = round2((monthlyRent * eqAccumPct) / 100);
    const rentPortion = round2(monthlyRent - equityPortion);

    const optionFeePct = nnum(scheme.optionFeePercent) || 2;
    const optionFee = dto.optionFeeAmount ?? round2((value * optionFeePct) / 100);

    const rto = await tx.rtoContract.create({
      data: {
        leaseAgreementId: lease.id,
        totalContractValue: value,
        optionFeeAmount: optionFee,
        monthlyRentPortion: rentPortion,
        monthlyEquityPortion: equityPortion,
        accumulatedEquity: 0,
        targetPurchaseDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + nnum(scheme.targetPurchaseYears) || 5),
        ),
        purchaseOptionPrice: value,
        status: 'active',
      },
    });

    if (optionFee > 0) {
      await tx.rtoEquityLedger.create({
        data: {
          rtoContractId: rto.id,
          transactionType: 'option_fee',
          amount: optionFee,
          runningBalance: optionFee,
          reference: `RTO-INIT-${rto.id.slice(0, 8).toUpperCase()}`,
          createdByUserId: performedByUserId,
        },
      });
      await tx.rtoContract.update({
        where: { id: rto.id },
        data: { accumulatedEquity: optionFee },
      });

      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + 15);
      const inv = await this.createInvoice(
        tx,
        tenantId,
        buyerId,
        optionFee,
        dueDate,
        'reservation',
        `RTO option fee for ${unit.unitNumber}`,
        lease.id,
      );
      result.invoice = { id: inv.id, invoiceNumber: inv.invoiceNumber, amount: Number(inv.amount) };
    }

    result.rtoContractId = rto.id;
    result.rto = {
      equityAccumulationPercent: eqAccumPct,
      monthlyEquityPortion: equityPortion,
      monthlyRentPortion: rentPortion,
    };
  }

  // ── Spot Cash: single discounted invoice ──
  private async generateSpotCashInvoice(
    tx: any,
    scheme: any,
    lease: any,
    unit: any,
    value: number,
    startDate: Date,
    tenantId: string,
    buyerId: string,
    result: any,
  ) {
    const discountPct = nnum(scheme.discountPercent);
    const invoiceAmount = discountPct > 0 ? round2(value * (1 - discountPct / 100)) : value;
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 15);
    const inv = await this.createInvoice(
      tx,
      tenantId,
      buyerId,
      invoiceAmount,
      dueDate,
      'downpayment',
      `Spot cash payment for ${unit.unitNumber}${discountPct > 0 ? ` (${discountPct}% discount)` : ''}`,
      lease.id,
    );
    result.invoice = { id: inv.id, invoiceNumber: inv.invoiceNumber, amount: Number(inv.amount) };
    if (discountPct > 0) {
      result.discount = { percent: discountPct, originalAmount: value, finalAmount: invoiceAmount };
    }
  }

  async listSchemes(): Promise<SchemeListItem[]> {
    const leases = await this.prisma.leaseAgreement.findMany({
      where: { schemeType: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { id: true, propertyCode: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        agent: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        scheme: { select: { id: true, code: true, name: true } },
        mortgageScenarios: { orderBy: { createdAt: 'desc' }, take: 1 },
        rtoContract: true,
      },
    });

    return (leases as any[]).map((l): SchemeListItem => ({
      id: l.id,
      schemeType: l.schemeType ?? null,
      unitLabel: l.unitLabel,
      unitId: l.unitId,
      propertyId: l.propertyId,
      propertyName: l.property?.propertyCode ?? '—',
      leaseType: l.leaseType as unknown as SchemeListItem['leaseType'],
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      isActive: l.isActive,
      mortgageScenarioId: l.mortgageScenarios?.[0]?.id ?? null,
      rtoContractId: l.rtoContract?.id ?? null,
      tenantUserId: l.tenantUserId,
      tenantName: l.tenant
        ? [l.tenant.firstName, l.tenant.lastName].filter(Boolean).join(' ') || l.tenant.email
        : null,
      monthlyRentAmount: Number(l.monthlyRentAmount) || null,
      agentId: l.agentId ?? null,
      agentName: l.agent?.user
        ? [l.agent.user.firstName, l.agent.user.lastName].filter(Boolean).join(' ') ||
          l.agent.user.email
        : null,
      schemeId: l.schemeId ?? null,
      schemeCode: l.scheme?.code ?? null,
      schemeName: l.scheme?.name ?? null,
    }));
  }

  private async createInvoice(
    tx: any,
    tenantId: string,
    userId: string,
    amount: number,
    dueDate: Date,
    type: string,
    notes: string,
    leaseId?: string,
  ) {
    // Centralized, collision-free, incremental invoice numbering.
    const invoiceNumber = await this.codeSequence.next('ar_invoice', {
      prefix: 'INV',
      suffix: String(new Date().getFullYear()),
    });
    return tx.arInvoice.create({
      data: {
        tenantId,
        userId,
        invoiceType: type,
        referenceSource: leaseId ? `lease:${leaseId}` : undefined,
        invoiceNumber,
        amount,
        dueDate,
        status: 'pending',
        issuedDate: new Date(),
        notes,
      },
    });
  }
}
