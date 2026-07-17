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

export function bucketForDays(days: number): BucketName {
  if (days <= 0) return 'Current';
  if (days <= 30) return 'Bucket31_60';
  if (days <= 60) return 'Bucket61_90';
  if (days <= 90) return 'Bucket91_120';
  return 'Bucket120Plus';
}

@Injectable()
export class ArAgingService {
  constructor(private prisma: PrismaService) {}

  async generateArAgingReport(asOfDate?: string, tenantId?: string) {
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const asOfTime = asOf.getTime();
    const DAY = 86_400_000;

    const where: any = {
      status: { in: ['pending', 'overdue', 'partially_paid', 'disputed'] },
    };
    if (tenantId) where.tenantId = tenantId;

    const invoices = await this.prisma.arInvoice.findMany({
      where,
      include: {
        payments: true,
        tenant: true,
      },
    });

    const userIds = Array.from(new Set(invoices.map((inv) => inv.userId)));
    let usersById = new Map<string, any>();
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        include: {
          leaseAgreementsAsTenant: { include: { property: true } },
        },
      });
      usersById = new Map(users.map((u) => [u.id, u]));
    }

    const buckets: Record<
      BucketName,
      { name: BucketName; total: number; count: number }
    > = {
      Current: { name: 'Current', total: 0, count: 0 },
      Bucket31_60: { name: 'Bucket31_60', total: 0, count: 0 },
      Bucket61_90: { name: 'Bucket61_90', total: 0, count: 0 },
      Bucket91_120: { name: 'Bucket91_120', total: 0, count: 0 },
      Bucket120Plus: { name: 'Bucket120Plus', total: 0, count: 0 },
    };

    const byUserMap = new Map<
      string,
      { userId: string; userName: string; totalOutstanding: number; buckets: Record<BucketName, number> }
    >();
    const byPropertyMap = new Map<
      string,
      { propertyId: string; propertyCode: string; totalOutstanding: number; buckets: Record<BucketName, number> }
    >();
    const byInvoiceTypeMap = new Map<
      string,
      { invoiceType: string; totalOutstanding: number; buckets: Record<BucketName, number> }
    >();

    let totalReceivable = 0;

    const invoiceRows: Array<{
      invoiceId: string;
      invoiceNumber: string;
      invoiceType: string;
      userId: string;
      userName: string;
      propertyId: string | null;
      propertyCode: string | null;
      amount: number;
      paid: number;
      outstanding: number;
      dueDate: Date;
      daysOverdue: number;
      bucket: BucketName;
      status: string;
    }> = [];

    for (const invoice of invoices) {
      const paid = (invoice.payments || []).reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const outstanding = Number(invoice.amount) - paid;
      if (outstanding <= 0) continue;

      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((asOfTime - dueDate.getTime()) / DAY);
      const bucketName = bucketForDays(daysOverdue);

      totalReceivable += outstanding;
      buckets[bucketName].total += outstanding;
      buckets[bucketName].count += 1;

      const user = usersById.get(invoice.userId);
      const property = user?.leaseAgreementsAsTenant?.[0]?.property ?? null;
      const userName =
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        invoice.tenant?.name ||
        invoice.userId;

      if (!byUserMap.has(invoice.userId)) {
        byUserMap.set(invoice.userId, {
          userId: invoice.userId,
          userName,
          totalOutstanding: 0,
          buckets: { Current: 0, Bucket31_60: 0, Bucket61_90: 0, Bucket91_120: 0, Bucket120Plus: 0 },
        });
      }
      const userEntry = byUserMap.get(invoice.userId)!;
      userEntry.totalOutstanding += outstanding;
      userEntry.buckets[bucketName] += outstanding;

      if (property && property.id) {
        if (!byPropertyMap.has(property.id)) {
          byPropertyMap.set(property.id, {
            propertyId: property.id,
            propertyCode: property.propertyCode,
            totalOutstanding: 0,
            buckets: { Current: 0, Bucket31_60: 0, Bucket61_90: 0, Bucket91_120: 0, Bucket120Plus: 0 },
          });
        }
        const propEntry = byPropertyMap.get(property.id)!;
        propEntry.totalOutstanding += outstanding;
        propEntry.buckets[bucketName] += outstanding;
      }

      if (!byInvoiceTypeMap.has(invoice.invoiceType)) {
        byInvoiceTypeMap.set(invoice.invoiceType, {
          invoiceType: invoice.invoiceType,
          totalOutstanding: 0,
          buckets: { Current: 0, Bucket31_60: 0, Bucket61_90: 0, Bucket91_120: 0, Bucket120Plus: 0 },
        });
      }
      const typeEntry = byInvoiceTypeMap.get(invoice.invoiceType)!;
      typeEntry.totalOutstanding += outstanding;
      typeEntry.buckets[bucketName] += outstanding;

      invoiceRows.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber ?? invoice.id,
        invoiceType: invoice.invoiceType,
        userId: invoice.userId,
        userName,
        propertyId: property?.id ?? null,
        propertyCode: property?.propertyCode ?? null,
        amount: Number(invoice.amount),
        paid,
        outstanding,
        dueDate,
        daysOverdue,
        bucket: bucketName,
        status: invoice.status,
      });
    }

    invoiceRows.sort((a, b) => b.daysOverdue - a.daysOverdue);

    let activePaymentArrangements: any[] = [];
    if (tenantId) {
      const tenantUserIds = (
        await this.prisma.user.findMany({
          where: { tenantId },
          select: { id: true },
        })
      ).map((u) => u.id);
      activePaymentArrangements = await this.prisma.arPaymentArrangement.findMany({
        where: { status: 'active', userId: { in: tenantUserIds } },
      });
    } else {
      activePaymentArrangements = await this.prisma.arPaymentArrangement.findMany({
        where: { status: 'active' },
      });
    }

    return {
      asOfDate: asOf,
      totalReceivable,
      buckets: BUCKET_ORDER.map((name) => buckets[name]),
      byUser: Array.from(byUserMap.values()),
      byProperty: Array.from(byPropertyMap.values()),
      byInvoiceType: Array.from(byInvoiceTypeMap.values()),
      invoices: invoiceRows,
      activePaymentArrangements,
    };
  }
}
