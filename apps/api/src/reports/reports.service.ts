import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

export interface PortfolioKpis {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  activeLeases: number;
  monthlyRecurringRevenue: number;
  totalReceivable: number;
  openServiceRequests: number;
  activeRtoContracts: number;
  totalEquityAccumulated: number;
}

export interface RevenueTrendPoint {
  month: string;
  label: string;
  revenue: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private toNum(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  async getPortfolioKpis(tenantId?: string): Promise<PortfolioKpis> {
    const propertyWhere = tenantId ? { tenantId } : {};
    const unitWhere = tenantId ? { property: { tenantId } } : {};
    const leaseWhere = tenantId
      ? { property: { tenantId }, isActive: true }
      : { isActive: true };
    const rtoWhere = tenantId
      ? { leaseAgreement: { property: { tenantId } }, status: 'active' as any }
      : { status: 'active' as any };
    const srWhere = tenantId ? { tenantId } : {};
    const ccWhere = tenantId ? { tenantId } : {};

    const outstandingStatuses: InvoiceStatus[] = ['pending', 'overdue', 'partially_paid'];

    const totalProperties = await this.prisma.property.count({ where: propertyWhere });
    const totalUnits = await this.prisma.unit.count({ where: unitWhere });

    const activeLeaseRows = await this.prisma.leaseAgreement.findMany({
      where: tenantId
        ? { property: { tenantId }, isActive: true }
        : { isActive: true },
      select: { propertyId: true },
    });
    const activeLeasePropIds = [...new Set(activeLeaseRows.map((l) => l.propertyId))];
    const occupiedUnits = await this.prisma.unit.count({
      where: {
        propertyId: { in: activeLeasePropIds },
        ...(tenantId ? { property: { tenantId } } : {}),
      },
    });

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 1000) / 10 : 0;

    const activeLeases = await this.prisma.leaseAgreement.count({ where: leaseWhere });

    const mrrAgg = await this.prisma.leaseAgreement.aggregate({
      where: leaseWhere,
      _sum: { monthlyRentAmount: true },
    });
    const monthlyRecurringRevenue = this.toNum(mrrAgg._sum.monthlyRentAmount);

    // Single source of truth for receivables = the AR ledger (ar_invoices),
    // exactly as the AR Aging report computes it. rental_payments is the billing
    // schedule; it is NOT a parallel receivable ledger.
    const invoices = await this.prisma.arInvoice.findMany({
      where: {
        status: { in: outstandingStatuses },
        ...(tenantId ? { tenantId } : {}),
      },
      include: { payments: true },
    });
    let totalReceivable = 0;
    for (const inv of invoices) {
      const paid = (inv.payments ?? []).reduce((sum: number, p: { amount: any }) => sum + this.toNum(p.amount), 0);
      const outstanding = this.toNum(inv.amount) - paid;
      if (outstanding > 0) totalReceivable += outstanding;
    }

    const openServiceRequests = await this.prisma.serviceRequest.count({
      where: { status: { in: ['open', 'assigned', 'in_progress'] }, ...srWhere },
    });

    const rtoAgg = await this.prisma.rtoContract.aggregate({
      where: rtoWhere,
      _sum: { accumulatedEquity: true },
    });
    const totalEquityAccumulated = this.toNum(rtoAgg._sum.accumulatedEquity);

    const activeRtoContracts = await this.prisma.rtoContract.count({ where: rtoWhere });

    const _cc = await this.prisma.collectionCase.count({
      where: { status: { in: ['open', 'in_progress', 'escalated'] }, ...ccWhere },
    });

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      activeLeases,
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
      totalReceivable: Math.round(totalReceivable * 100) / 100,
      openServiceRequests,
      activeRtoContracts,
      totalEquityAccumulated: Math.round(totalEquityAccumulated * 100) / 100,
    };
  }

  async getRevenueTrend(months = 6): Promise<RevenueTrendPoint[]> {
    const n = Math.max(1, Math.min(60, Math.floor(months)));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);

    const payments = await this.prisma.rentalPayment.findMany({
      where: {
        status: { in: ['paid', 'partially_paid'] },
        paymentDate: { gte: start },
      },
      select: { paymentDate: true, amountPaid: true },
    });

    const map = new Map<string, number>();
    for (const p of payments) {
      if (!p.paymentDate) continue;
      const y = p.paymentDate.getFullYear();
      const m = p.paymentDate.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + this.toNum(p.amountPaid));
    }

    const result: RevenueTrendPoint[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      result.push({
        month: key,
        label,
        revenue: Math.round((map.get(key) ?? 0) * 100) / 100,
      });
    }
    return result;
  }
}
