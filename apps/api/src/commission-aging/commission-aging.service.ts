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
      status: { in: ['approved', 'pending', 'partially_paid'] },
    };

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

    const byProjectMap: Record<
      string,
      { projectId: string; projectName: string; totalUnpaid: number; buckets: Record<string, BucketAccumulator> }
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

      const txDate = new Date(tx.transactionDate);
      const daysOverdue = Math.floor((asOf.getTime() - txDate.getTime()) / DAY_MS);
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

      // By project (property-level since Property has no direct project FK)
      const projectId = tx.propertyId;
      const projectName = tx.property?.propertyCode || projectId;
      if (!byProjectMap[projectId]) {
        const bm: Record<string, BucketAccumulator> = {};
        for (const b of BUCKET_ORDER) bm[b] = { name: b, total: 0, count: 0 };
        byProjectMap[projectId] = { projectId, projectName, totalUnpaid: 0, buckets: bm };
      }
      byProjectMap[projectId].totalUnpaid += unpaid;
      byProjectMap[projectId].buckets[bucket].total += unpaid;
      byProjectMap[projectId].buckets[bucket].count += 1;

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
    const byProject = Object.values(byProjectMap).map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
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
      byProject,
      byType,
    };
  }
}
