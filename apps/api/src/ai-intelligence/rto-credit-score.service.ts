import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RtoCreditScoreReport {
  rtoContractId: string;
  tenantUserId: string;
  tenantName: string;
  creditScore: number; // 300 - 850 (FICO styled)
  conversionReadinessIndex: number; // 0 - 100%
  delinquencyRiskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  factors: {
    paymentReliabilityScore: number; // 0 - 100
    utilityStabilityScore: number; // 0 - 100
    equityAccumulationScore: number; // 0 - 100
    arDelinquencyScore: number; // 0 - 100
  };
  metrics: {
    totalPaymentsLogged: number;
    onTimePaymentsCount: number;
    onTimePaymentRatio: number; // percentage
    accumulatedEquity: number;
    targetPurchasePrice: number;
    equityProgressPercent: number;
    outstandingArBalance: number;
    averageUtilityVariance: number;
  };
  aiRecommendations: string[];
  conversionProbabilityForecast: {
    monthsToConversionReady: number;
    forecastedExerciseDate: string;
    suggestedMonthlyEquityAdjustment: number;
  };
}

@Injectable()
export class RtoCreditScoreService {
  constructor(private prisma: PrismaService) {}

  async calculateRtoScore(rtoContractId: string): Promise<RtoCreditScoreReport> {
    const rto = await this.prisma.rtoContract.findUnique({
      where: { id: rtoContractId },
      include: {
        leaseAgreement: {
          include: {
            tenant: true,
            rentalPayments: true,
            property: true,
          },
        },
        paymentAllocations: true,
        equityLedger: true,
      },
    });

    if (!rto || !rto.leaseAgreement) {
      throw new NotFoundException(`RTO Contract with ID ${rtoContractId} not found`);
    }

    const tenantUser = rto.leaseAgreement.tenant;
    const leaseId = rto.leaseAgreement.id;

    // 1. On-Time Payment Reliability (Weight: 35%)
    const payments = rto.leaseAgreement.rentalPayments || [];
    const totalPayments = payments.length;
    const onTimePayments = payments.filter((p) => p.status === 'paid' && !p.lateFeeApplied).length;
    const onTimeRatio = totalPayments > 0 ? onTimePayments / totalPayments : 0.85;
    const paymentReliabilityScore = Math.min(100, Math.round(onTimeRatio * 100));

    // 2. Utility Stability (Weight: 20%)
    const utilityBills = await this.prisma.utilityBill.findMany({
      where: {
        propertyId: rto.leaseAgreement.propertyId,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    let utilityStabilityScore = 80;
    let avgVariance = 0;
    if (utilityBills.length >= 2) {
      const consumptions = utilityBills.map((b) => b.consumption);
      const mean = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
      const variance =
        consumptions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / consumptions.length;
      const stdDev = Math.sqrt(variance);
      avgVariance = mean > 0 ? (stdDev / mean) * 100 : 15;
      utilityStabilityScore = Math.max(20, Math.min(100, Math.round(100 - avgVariance * 1.2)));
    }

    // 3. Equity Accumulation vs Target (Weight: 25%)
    const accumulatedEquity = Number(rto.accumulatedEquity || 0);
    const targetPrice = Number(rto.purchaseOptionPrice || rto.totalContractValue || 1);
    const targetEquityGoal = targetPrice * 0.2; // 20% downpayment standard for purchase conversion
    const equityProgressPercent = Math.min(100, (accumulatedEquity / targetEquityGoal) * 100);
    const equityAccumulationScore = Math.min(100, Math.round(equityProgressPercent));

    // 4. Accounts Receivable Delinquency (Weight: 20%)
    const openInvoices = await this.prisma.arInvoice.findMany({
      where: {
        userId: tenantUser.id,
        status: { in: ['pending', 'overdue', 'partially_paid'] },
      },
    });

    const outstandingBalance = openInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const overdueInvoicesCount = openInvoices.filter((i) => i.status === 'overdue').length;
    let arDelinquencyScore = 100;
    if (overdueInvoicesCount > 0) arDelinquencyScore -= overdueInvoicesCount * 25;
    if (outstandingBalance > 20000) arDelinquencyScore -= 20;
    arDelinquencyScore = Math.max(0, Math.min(100, arDelinquencyScore));

    // Composite Conversion Readiness Index (0 - 100)
    const compositeIndex = Math.round(
      paymentReliabilityScore * 0.35 +
        utilityStabilityScore * 0.2 +
        equityAccumulationScore * 0.25 +
        arDelinquencyScore * 0.2,
    );

    // FICO-scaled Credit Score (300 to 850)
    const creditScore = Math.round(300 + (compositeIndex / 100) * 550);

    // Risk Tier
    let delinquencyRiskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    if (compositeIndex >= 80) delinquencyRiskTier = 'LOW';
    else if (compositeIndex >= 60) delinquencyRiskTier = 'MODERATE';
    else if (compositeIndex >= 40) delinquencyRiskTier = 'HIGH';
    else delinquencyRiskTier = 'CRITICAL';

    // AI Recommendations
    const aiRecommendations: string[] = [];
    if (onTimeRatio >= 0.95) {
      aiRecommendations.push(
        'Excellent on-time rental history. Candidate qualifies for expedited option purchase approval.',
      );
    } else if (onTimeRatio < 0.75) {
      aiRecommendations.push(
        'Frequent payment delays observed. Recommend setting up automated payment reminders via SMS.',
      );
    }

    if (equityProgressPercent >= 75) {
      aiRecommendations.push(
        'Accumulated equity covers >75% of target downpayment. Recommend initiating mortgage pre-qualification.',
      );
    } else {
      const remainingEquity = Math.max(0, targetEquityGoal - accumulatedEquity);
      const monthlyEquity = Number(rto.monthlyEquityPortion || 10000);
      const estMonths = monthlyEquity > 0 ? Math.ceil(remainingEquity / monthlyEquity) : 24;
      aiRecommendations.push(
        `At current rate, candidate will reach conversion readiness threshold in approx. ${estMonths} months.`,
      );
    }

    if (overdueInvoicesCount > 0) {
      aiRecommendations.push(
        `Has ${overdueInvoicesCount} overdue invoice(s) totalling ₱${outstandingBalance.toLocaleString()}. Clear arrears prior to option exercise.`,
      );
    }

    const estMonthsRemaining = Math.max(
      1,
      Math.ceil((targetEquityGoal - accumulatedEquity) / Number(rto.monthlyEquityPortion || 10000)),
    );
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + estMonthsRemaining);

    return {
      rtoContractId,
      tenantUserId: tenantUser.id,
      tenantName: `${tenantUser.firstName || ''} ${tenantUser.lastName || ''}`.trim() || 'Resident',
      creditScore,
      conversionReadinessIndex: compositeIndex,
      delinquencyRiskTier,
      factors: {
        paymentReliabilityScore,
        utilityStabilityScore,
        equityAccumulationScore,
        arDelinquencyScore,
      },
      metrics: {
        totalPaymentsLogged: totalPayments,
        onTimePaymentsCount: onTimePayments,
        onTimePaymentRatio: Math.round(onTimeRatio * 100),
        accumulatedEquity,
        targetPurchasePrice: targetPrice,
        equityProgressPercent: Math.round(equityProgressPercent),
        outstandingArBalance: outstandingBalance,
        averageUtilityVariance: Math.round(avgVariance),
      },
      aiRecommendations,
      conversionProbabilityForecast: {
        monthsToConversionReady: estMonthsRemaining,
        forecastedExerciseDate: forecastDate.toISOString(),
        suggestedMonthlyEquityAdjustment:
          compositeIndex > 75
            ? Number(rto.monthlyEquityPortion || 0) * 1.15
            : Number(rto.monthlyEquityPortion || 0),
      },
    };
  }
}
