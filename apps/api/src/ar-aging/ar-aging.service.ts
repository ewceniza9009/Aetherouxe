import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type BucketName = 'Current' | 'Bucket31_60' | 'Bucket61_90' | 'Bucket91_120' | 'Bucket120Plus';

const BUCKET_ORDER: BucketName[] = [
  'Current',
  'Bucket31_60',
  'Bucket61_90',
  'Bucket91_120',
  'Bucket120Plus',
];

function bucketForDays(days: number): BucketName {
  if (days <= 30) return 'Current';
  if (days <= 60) return 'Bucket31_60';
  if (days <= 90) return 'Bucket61_90';
  if (days <= 120) return 'Bucket91_120';
  return 'Bucket120Plus';
}

@Injectable()
export class ArAgingService {
  constructor(private prisma: PrismaService) {}

  async generateArAgingReport(asOfDate?: string, tenantId?: string) {
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const asOfTime = asOf.getTime();

    const where: any = {
      status: { in: ['pending', 'overdue', 'partially_paid'] },
    };
    if (tenantId) {
      where.leaseAgreement = { property: { tenantId } };
    }

    const payments = await this.prisma.rentalPayment.findMany({
      where,
      include: {
        leaseAgreement: {
          include: {
            property: { include: { tenant: true } },
          },
        },
      },
    });

    const buckets: Record<BucketName, { name: BucketName; total: number; count: number }> = {
      Current: { name: 'Current', total: 0, count: 0 },
      Bucket31_60: { name: 'Bucket31_60', total: 0, count: 0 },
      Bucket61_90: { name: 'Bucket61_90', total: 0, count: 0 },
      Bucket91_120: { name: 'Bucket91_120', total: 0, count: 0 },
      Bucket120Plus: { name: 'Bucket120Plus', total: 0, count: 0 },
    };

    const byTenantMap = new Map<
      string,
      { tenantId: string; tenantName: string; totalOutstanding: number; buckets: Record<BucketName, number> }
    >();
    const byPropertyMap = new Map<
      string,
      { propertyId: string; propertyCode: string; totalOutstanding: number; buckets: Record<BucketName, number> }
    >();

    let totalReceivable = 0;

    for (const payment of payments) {
      const outstanding =
        Number(payment.amountDue) - Number(payment.amountPaid ?? 0);
      if (outstanding <= 0) continue;

      const dueDate = new Date(payment.dueDate);
      const daysOverdue = Math.max(0, Math.floor((asOfTime - dueDate.getTime()) / 86_400_000));
      const bucketName = bucketForDays(daysOverdue);

      totalReceivable += outstanding;
      buckets[bucketName].total += outstanding;
      buckets[bucketName].count += 1;

      const property = payment.leaseAgreement?.property;
      const tenant = property?.tenant;

      if (tenant && tenant.id) {
        if (!byTenantMap.has(tenant.id)) {
          byTenantMap.set(tenant.id, {
            tenantId: tenant.id,
            tenantName: tenant.name,
            totalOutstanding: 0,
            buckets: { Current: 0, Bucket31_60: 0, Bucket61_90: 0, Bucket91_120: 0, Bucket120Plus: 0 },
          });
        }
        const entry = byTenantMap.get(tenant.id)!;
        entry.totalOutstanding += outstanding;
        entry.buckets[bucketName] += outstanding;
      }

      if (property && property.id) {
        if (!byPropertyMap.has(property.id)) {
          byPropertyMap.set(property.id, {
            propertyId: property.id,
            propertyCode: property.propertyCode,
            totalOutstanding: 0,
            buckets: { Current: 0, Bucket31_60: 0, Bucket61_90: 0, Bucket91_120: 0, Bucket120Plus: 0 },
          });
        }
        const entry = byPropertyMap.get(property.id)!;
        entry.totalOutstanding += outstanding;
        entry.buckets[bucketName] += outstanding;
      }
    }

    return {
      asOfDate: asOf,
      totalReceivable,
      buckets: BUCKET_ORDER.map((name) => buckets[name]),
      byTenant: Array.from(byTenantMap.values()),
      byProperty: Array.from(byPropertyMap.values()),
    };
  }
}
