import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type Money = number;

export const OUTSTANDING_STATUSES = [
  'pending',
  'overdue',
  'partially_paid',
  'disputed',
] as const;

export type OutstandingStatus = (typeof OUTSTANDING_STATUSES)[number];

export interface ReceivableInvoice {
  amount: any;
  status: string;
  payments?: { amount: any }[];
}

/**
 * Single source of truth for money math across the platform.
 *
 * Every receivable / commission figure (AR Aging, Analytics KPIs, future
 * money features) must be derived through these helpers so the numbers can
 * never silently diverge between reports. Previously the "outstanding =
 * amount - sum(payments)" formula was copied in reports.service and
 * ar-aging.service with different rounding — that is exactly the class of
 * bug this service eliminates.
 */
@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /** Normalize Prisma Decimal / string / number to a 2-decimal number. */
  toMoney(value: any): Money {
    const n = typeof value === 'number' ? value : Number(value ?? 0);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
  }

  /** Outstanding balance of a single AR invoice. */
  invoiceOutstanding(invoice: ReceivableInvoice): Money {
    const paid = (invoice.payments ?? []).reduce(
      (sum: number, p: { amount: any }) => sum + this.toMoney(p.amount),
      0,
    );
    const outstanding = this.toMoney(invoice.amount) - paid;
    return outstanding > 0 ? outstanding : 0;
  }

  /** Is this invoice status part of the outstanding receivable set? */
  isOutstanding(status: string): status is OutstandingStatus {
    return (OUTSTANDING_STATUSES as readonly string[]).includes(status);
  }

  /**
   * Total outstanding receivables for a tenant, reading the AR ledger only.
   * Mirrors the AR Aging computation exactly.
   */
  async totalReceivable(tenantId?: string): Promise<Money> {
    const invoices = await this.prisma.arInvoice.findMany({
      where: {
        status: { in: [...OUTSTANDING_STATUSES] },
        ...(tenantId ? { tenantId } : {}),
      },
      include: { payments: true },
    });

    return invoices.reduce(
      (total: Money, inv) => total + this.invoiceOutstanding(inv),
      0,
    );
  }

  /**
   * Owed vs paid commission for a transaction that carries
   * finalCommission/calculatedCommission and commissionReleases.
   * Releases with a status in `excludeStatuses` are ignored (e.g. 'cancelled').
   */
  commissionBalance(
    tx: {
      finalCommission?: any;
      calculatedCommission?: any;
      commissionReleases?: { amount: any; status?: string }[];
    },
    excludeStatuses: string[] = [],
  ): { owed: Money; paid: Money; remaining: Money } {
    const owed = this.toMoney(tx.finalCommission ?? tx.calculatedCommission ?? 0);
    const paid = (tx.commissionReleases ?? [])
      .filter((r) => !excludeStatuses.includes(r.status ?? ''))
      .reduce((sum: number, r: { amount: any }) => sum + this.toMoney(r.amount), 0);
    return {
      owed,
      paid,
      remaining: Math.max(0, owed - paid),
    };
  }
}
