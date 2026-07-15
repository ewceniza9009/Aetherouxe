import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

const BUCKET_ORDER = [
  'Current',
  'Bucket31_60',
  'Bucket61_90',
  'Bucket91_120',
  'Bucket120Plus',
] as const;
type BucketName = (typeof BUCKET_ORDER)[number];

function bucketForDays(days: number): BucketName {
  if (days <= 30) return 'Current';
  if (days <= 60) return 'Bucket31_60';
  if (days <= 90) return 'Bucket61_90';
  if (days <= 120) return 'Bucket91_120';
  return 'Bucket120Plus';
}

export interface BucketAccumulator {
  name: BucketName;
  total: number;
  count: number;
}

@Injectable()
export class CommissionAgingService {
  constructor(private prisma: PrismaService) {}

  async generateAgingReport(tenantId?: string, asOfDate?: Date) {
    const asOf = asOfDate ? new Date(asOfDate) : new Date();

    const where: any = {
      status: { not: 'fully_paid' },
    };
    if (tenantId) {
      where.agent = { tenantId };
    }

    const transactions = await this.prisma.agentTransaction.findMany({
      where,
      include: {
        agent: { include: { user: true } },
        property: true,
        commissionReleases: true,
      },
    });

    const bucketsMap: Record<string, BucketAccumulator> = {};
    for (const b of BUCKET_ORDER) bucketsMap[b] = { name: b, total: 0, count: 0 };

    const byAgentMap: Record<
      string,
      { agentId: string; agentName: string; totalUnpaid: number; buckets: Record<string, BucketAccumulator> }
    > = {};

    const byPropertyMap: Record<
      string,
      { propertyId: string; propertyName: string; totalUnpaid: number; buckets: Record<string, BucketAccumulator> }
    > = {};

    const byTypeMap: Record<
      string,
      { transactionType: string; totalUnpaid: number; buckets: Record<string, BucketAccumulator> }
    > = {};

    let totalUnpaid = 0;

    for (const tx of transactions) {
      const owed = Number(tx.finalCommission ?? tx.calculatedCommission);
      const paid = tx.commissionReleases.reduce((sum, r) => sum + Number(r.amount), 0);
      const unpaid = owed - paid;
      if (unpaid <= 0) continue;

      // Anchor the aging on the most recent commission release date when
      // releases exist; otherwise fall back to the transaction date.
      const anchorDate =
        tx.commissionReleases.length > 0
          ? tx.commissionReleases.reduce(
              (max, r) =>
                new Date(r.releaseDate).getTime() > new Date(max).getTime()
                  ? r.releaseDate
                  : max,
              tx.commissionReleases[0].releaseDate,
            )
          : tx.transactionDate;

      const daysOverdue = Math.floor(
        (asOf.getTime() - new Date(anchorDate).getTime()) / DAY_MS,
      );
      const bucket = bucketForDays(daysOverdue);

      totalUnpaid += unpaid;

      // Global buckets
      bucketsMap[bucket].total += unpaid;
      bucketsMap[bucket].count += 1;

      // By agent
      const agentId = tx.agentId;
      const agentName = `${tx.agent?.user?.firstName || ''} ${tx.agent?.user?.lastName || ''}`.trim();
      if (!byAgentMap[agentId]) {
        const bm: Record<string, BucketAccumulator> = {};
        for (const b of BUCKET_ORDER) bm[b] = { name: b, total: 0, count: 0 };
        byAgentMap[agentId] = { agentId, agentName, totalUnpaid: 0, buckets: bm };
      }
      byAgentMap[agentId].totalUnpaid += unpaid;
      byAgentMap[agentId].buckets[bucket].total += unpaid;
      byAgentMap[agentId].buckets[bucket].count += 1;

      // By property (grouped at property level)
      const propertyId = tx.propertyId;
      const propertyName = tx.property?.propertyCode || propertyId;
      if (!byPropertyMap[propertyId]) {
        const bm: Record<string, BucketAccumulator> = {};
        for (const b of BUCKET_ORDER) bm[b] = { name: b, total: 0, count: 0 };
        byPropertyMap[propertyId] = { propertyId, propertyName, totalUnpaid: 0, buckets: bm };
      }
      byPropertyMap[propertyId].totalUnpaid += unpaid;
      byPropertyMap[propertyId].buckets[bucket].total += unpaid;
      byPropertyMap[propertyId].buckets[bucket].count += 1;

      // By type
      const type = tx.transactionType;
      if (!byTypeMap[type]) {
        const bm: Record<string, BucketAccumulator> = {};
        for (const b of BUCKET_ORDER) bm[b] = { name: b, total: 0, count: 0 };
        byTypeMap[type] = { transactionType: type, totalUnpaid: 0, buckets: bm };
      }
      byTypeMap[type].totalUnpaid += unpaid;
      byTypeMap[type].buckets[bucket].total += unpaid;
      byTypeMap[type].buckets[bucket].count += 1;
    }

    const buckets = BUCKET_ORDER.map((b) => bucketsMap[b]);
    const byAgent = Object.values(byAgentMap).map((a) => ({
      agentId: a.agentId,
      agentName: a.agentName,
      totalUnpaid: a.totalUnpaid,
      buckets: BUCKET_ORDER.map((b) => a.buckets[b]),
    }));
    const byProperty = Object.values(byPropertyMap).map((p) => ({
      propertyId: p.propertyId,
      propertyName: p.propertyName,
      totalUnpaid: p.totalUnpaid,
      buckets: BUCKET_ORDER.map((b) => p.buckets[b]),
    }));
    const byType = Object.values(byTypeMap).map((t) => ({
      transactionType: t.transactionType,
      totalUnpaid: t.totalUnpaid,
      buckets: BUCKET_ORDER.map((b) => t.buckets[b]),
    }));

    return {
      asOfDate: asOf,
      totalUnpaid,
      buckets,
      byAgent,
      byProperty,
      byType,
    };
  }
}
