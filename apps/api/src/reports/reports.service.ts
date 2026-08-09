import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

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

export interface SalesReport {
  totalSalesVolume: number;
  totalAccountsReceivable: number;
  unitsSold: number;
  totalUnits: number;
  propertyPerformance: Array<{
    propertyId: string;
    propertyCode: string;
    propertyName: string;
    totalUnits: number;
    unitsSold: number;
    salesVolume: number;
  }>;
  recentSales: Array<{
    id: string;
    unitNumber: string;
    propertyName: string;
    buyerName: string;
    date: string;
    schemeType: string;
    contractValue: number;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  private toNum(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  async getPortfolioKpis(tenantId?: string): Promise<PortfolioKpis> {
    const propertyWhere = tenantId ? { tenantId } : {};
    const unitWhere = tenantId ? { property: { tenantId } } : {};
    const leaseWhere = tenantId ? { property: { tenantId }, isActive: true } : { isActive: true };
    const rtoWhere = tenantId
      ? { leaseAgreement: { property: { tenantId } }, status: 'active' as any }
      : { status: 'active' as any };
    const srWhere = tenantId ? { tenantId } : {};
    const ccWhere = tenantId ? { tenantId } : {};

    const totalProperties = await this.prisma.property.count({ where: propertyWhere });
    const totalUnits = await this.prisma.unit.count({ where: unitWhere });

    const activeLeaseRows = await this.prisma.leaseAgreement.findMany({
      where: tenantId ? { property: { tenantId }, isActive: true } : { isActive: true },
      select: { propertyId: true },
    });
    const activeLeasePropIds = [...new Set(activeLeaseRows.map((l) => l.propertyId))];
    const occupiedUnits = await this.prisma.unit.count({
      where: {
        propertyId: { in: activeLeasePropIds },
        ...(tenantId ? { property: { tenantId } } : {}),
      },
    });

    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 1000) / 10 : 0;

    const activeLeases = await this.prisma.leaseAgreement.count({ where: leaseWhere });

    const mrrAgg = await this.prisma.leaseAgreement.aggregate({
      where: leaseWhere,
      _sum: { monthlyRentAmount: true },
    });
    const monthlyRecurringRevenue = this.toNum(mrrAgg._sum.monthlyRentAmount);

    // Single source of truth for receivables = the AR ledger (ar_invoices),
    // delegated to LedgerService so the figure can never diverge from the
    // AR Aging report. rental_payments is the billing schedule, NOT a
    // parallel receivable ledger.
    const totalReceivable = await this.ledger.totalReceivable(tenantId);

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

  async exportCsv(type: 'pnl' | 'ar' | 'gl' | 'kpis'): Promise<string> {
    if (type === 'kpis') {
      const kpis = await this.getPortfolioKpis();
      return [
        'Metric,Value',
        `Total Properties,${kpis.totalProperties}`,
        `Total Units,${kpis.totalUnits}`,
        `Occupied Units,${kpis.occupiedUnits}`,
        `Occupancy Rate (%),${kpis.occupancyRate}`,
        `Active Leases,${kpis.activeLeases}`,
        `Monthly Recurring Revenue,${kpis.monthlyRecurringRevenue}`,
        `Total Receivable,${kpis.totalReceivable}`,
        `Open Service Requests,${kpis.openServiceRequests}`,
        `Active RTO Contracts,${kpis.activeRtoContracts}`,
        `Total Equity Accumulated,${kpis.totalEquityAccumulated}`,
      ].join('\n');
    }

    if (type === 'pnl') {
      const pnls = await this.prisma.ownerPnlStatement.findMany({
        take: 100,
        orderBy: { generatedAt: 'desc' },
        include: { owner: true, property: true },
      });
      const headers = [
        'ID,Owner,Property,Period Start,Period End,Gross Income,Expenses,Net Income,Status',
      ];
      const rows = pnls.map((p) =>
        [
          p.id,
          `"${p.owner?.firstName ?? ''} ${p.owner?.lastName ?? ''}"`,
          `"${p.property?.propertyCode ?? ''}"`,
          p.periodStart.toISOString().split('T')[0],
          p.periodEnd.toISOString().split('T')[0],
          p.grossRentalIncome,
          p.totalExpenses,
          p.netIncome,
          p.status,
        ].join(','),
      );
      return headers.concat(rows).join('\n');
    }

    if (type === 'gl') {
      const entries = await this.prisma.journalEntry.findMany({
        take: 200,
        orderBy: { date: 'desc' },
      });
      const headers = ['Entry ID,Date,Reference,Notes'];
      const rows = entries.map((e) =>
        [
          e.id,
          e.date.toISOString().split('T')[0],
          `"${e.reference ?? ''}"`,
          `"${e.notes ?? ''}"`,
        ].join(','),
      );
      return headers.concat(rows).join('\n');
    }

    // Default AR export
    const arInvoices = await this.prisma.arInvoice.findMany({
      take: 200,
      orderBy: { dueDate: 'asc' },
    });
    const headers = ['Invoice ID,Status,Due Date,Total Amount,Paid Amount,Balance'];
    const rows = arInvoices.map((inv) =>
      [inv.id, inv.status, inv.dueDate.toISOString().split('T')[0], inv.amount, inv.amount, 0].join(
        ',',
      ),
    );
    return headers.concat(rows).join('\n');
  }

  async getSalesKpis(tenantId?: string) {
    const allUnits = await this.prisma.unit.findMany({
      where: tenantId ? { property: { tenantId } } : {},
      include: { property: true },
    });

    const totalUnits = allUnits.length;
    const unitsSold = allUnits.filter((u) => u.status === 'sold').length;

    const leases = await this.prisma.leaseAgreement.findMany({
      where: {
        ...(tenantId ? { property: { tenantId } } : {}),
        schemeType: { not: 'standard_rental' },
      },
      include: {
        rtoContract: true,
        mortgageScenarios: true,
      },
    });

    let totalSalesVolume = 0;
    for (const l of leases) {
      if (l.rtoContract) {
        totalSalesVolume += Number(l.rtoContract.totalContractValue);
      } else if (l.mortgageScenarios?.length) {
        totalSalesVolume += Number(l.mortgageScenarios[0].propertyValueAtGeneration);
      } else if (l.schemeType === 'spot_cash' || l.schemeType === 'installment') {
        const invoices = await this.prisma.arInvoice.findMany({
          where: { referenceSource: `lease:${l.id}` },
        });
        totalSalesVolume += invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      }
    }

    const totalAccountsReceivable = await this.ledger.totalReceivable(tenantId);

    return {
      totalSalesVolume,
      totalAccountsReceivable,
      unitsSold,
      totalUnits,
    };
  }

  async getSalesPropertyPerformance(
    query: import('../common/dto/list-query.dto').ListQueryDto,
    tenantId?: string,
  ) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const search = query.search === 'undefined' ? undefined : query.search;
    const sort = query.sort === 'undefined' ? undefined : query.sort;
    const order = query.order || 'desc';
    const skip = (page - 1) * limit;

    const where: any = tenantId ? { tenantId } : {};
    if (search) {
      where.propertyCode = { contains: search, mode: 'insensitive' };
    }

    const [total, properties] = await Promise.all([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        // we won't sort at DB level if they want to sort by calculated fields like salesVolume
      }),
    ]);

    const performanceMap = new Map<
      string,
      { total: number; sold: number; vol: number; name: string; code: string }
    >();
    for (const p of properties) {
      performanceMap.set(p.id, {
        total: 0,
        sold: 0,
        vol: 0,
        name: p.propertyCode,
        code: p.propertyCode,
      });
    }

    const units = await this.prisma.unit.findMany({
      where: { propertyId: { in: properties.map((p) => p.id) } },
    });
    for (const u of units) {
      const pm = performanceMap.get(u.propertyId!);
      if (pm) {
        pm.total += 1;
        if (u.status === 'sold') pm.sold += 1;
      }
    }

    const leases = await this.prisma.leaseAgreement.findMany({
      where: {
        propertyId: { in: properties.map((p) => p.id) },
        schemeType: { not: 'standard_rental' },
      },
      include: {
        rtoContract: true,
        mortgageScenarios: true,
      },
    });

    for (const l of leases) {
      let tcp = 0;
      if (l.rtoContract) {
        tcp = Number(l.rtoContract.totalContractValue);
      } else if (l.mortgageScenarios?.length) {
        tcp = Number(l.mortgageScenarios[0].propertyValueAtGeneration);
      } else if (l.schemeType === 'spot_cash' || l.schemeType === 'installment') {
        const invoices = await this.prisma.arInvoice.findMany({
          where: { referenceSource: `lease:${l.id}` },
        });
        tcp = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      }

      const pm = performanceMap.get(l.propertyId);
      if (pm) pm.vol += tcp;
    }

    let results = Array.from(performanceMap.entries()).map(([id, val]) => ({
      propertyId: id,
      propertyCode: val.code,
      propertyName: val.name,
      totalUnits: val.total,
      unitsSold: val.sold,
      salesVolume: val.vol,
    }));

    if (sort) {
      results.sort((a, b) => {
        let valA = a[sort as keyof typeof a];
        let valB = b[sort as keyof typeof b];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return order === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    results = results.slice(skip, skip + limit);

    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSalesLedger(
    query: import('../common/dto/list-query.dto').ListQueryDto,
    tenantId?: string,
  ) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const search = query.search === 'undefined' ? undefined : query.search;
    const sort = query.sort === 'undefined' ? undefined : query.sort;
    const order = query.order || 'desc';
    const skip = (page - 1) * limit;

    const where: any = {
      ...(tenantId ? { property: { tenantId } } : {}),
      schemeType: { not: 'standard_rental' },
    };

    if (search) {
      where.OR = [
        { unitLabel: { contains: search, mode: 'insensitive' } },
        { tenant: { firstName: { contains: search, mode: 'insensitive' } } },
        { tenant: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Determine DB sort
    let orderBy: any = undefined;
    if (sort === 'date') orderBy = { startDate: order };
    else if (sort === 'unitNumber') orderBy = { unitLabel: order };
    else if (sort === 'schemeType') orderBy = { schemeType: order };
    // We can't DB sort on contractValue easily if it requires invoices

    const [total, leases] = await Promise.all([
      this.prisma.leaseAgreement.count({ where }),
      this.prisma.leaseAgreement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          unit: true,
          property: true,
          tenant: true,
          rtoContract: true,
          mortgageScenarios: true,
        },
      }),
    ]);

    const results = [];
    for (const l of leases) {
      let tcp = 0;
      if (l.rtoContract) {
        tcp = Number(l.rtoContract.totalContractValue);
      } else if (l.mortgageScenarios?.length) {
        tcp = Number(l.mortgageScenarios[0].propertyValueAtGeneration);
      } else if (l.schemeType === 'spot_cash' || l.schemeType === 'installment') {
        const invoices = await this.prisma.arInvoice.findMany({
          where: { referenceSource: `lease:${l.id}` },
        });
        tcp = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      }

      results.push({
        id: l.id,
        unitNumber: l.unitLabel || '',
        propertyName: l.property?.propertyCode ?? '',
        buyerName: l.tenant?.firstName
          ? `${l.tenant.firstName} ${l.tenant.lastName}`
          : (l.tenant?.email ?? ''),
        date: l.startDate.toISOString(),
        schemeType: l.schemeType || '',
        contractValue: tcp,
      });
    }

    if (sort === 'contractValue') {
      results.sort((a, b) =>
        order === 'asc' ? a.contractValue - b.contractValue : b.contractValue - a.contractValue,
      );
    } else if (sort === 'buyerName') {
      results.sort((a, b) =>
        order === 'asc'
          ? a.buyerName.localeCompare(b.buyerName)
          : b.buyerName.localeCompare(a.buyerName),
      );
    } else if (sort === 'propertyName') {
      results.sort((a, b) =>
        order === 'asc'
          ? a.propertyName.localeCompare(b.propertyName)
          : b.propertyName.localeCompare(a.propertyName),
      );
    }

    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
