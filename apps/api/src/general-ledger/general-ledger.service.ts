import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface GlEntriesQuery {
  search?: string;
  function?: string;
  page?: string;
  limit?: string;
}

export interface GlEntriesResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: { totalDebit: number; totalCredit: number; balance: number };
}

export interface GlEntrySource {
  sourceType?: string;
  sourceId?: string;
  parentId?: string;
}

@Injectable()
export class GeneralLedgerService {
  constructor(private prisma: PrismaService) {}

  private parseSource(reference?: string | null): GlEntrySource {
    const ref = reference ?? '';
    // COMM-{seq}            -> commission accrual (drill to agent transaction by seq)
    if (/^COMM-\d+$/.test(ref)) {
      return { sourceType: 'COMMISSION', sourceId: ref };
    }
    // COMM-PAY-{seq or id}  -> commission payment (drill into AP disbursement list)
    if (/^COMM-PAY-/.test(ref)) {
      return { sourceType: 'COMMISSION', sourceId: ref };
    }
    // DISB-WO-{source}      -> work-order AP disbursement
    if (ref.startsWith('DISB-WO-')) {
      return { sourceType: 'DISBURSEMENT', sourceId: ref.slice(8) };
    }
    // SVC-AP-{sourceId}     -> service-request AP invoice (drill into service request)
    if (ref.startsWith('SVC-AP-')) {
      return { sourceType: 'SERVICE_REQUEST', sourceId: ref.slice(7) };
    }
    // SALE-{title}          -> title transfer / sale; drill to property via DB lookup
    if (ref.startsWith('SALE-')) {
      return { sourceType: 'TITLE_TRANSFER', sourceId: ref.slice(5) };
    }
    // Backwards-compat: legacy AP-AP- / COMM-ACC- / SALE-CONTRACT-
    if (ref.startsWith('AP-AP-')) {
      return { sourceType: 'SERVICE_REQUEST', sourceId: ref.slice(6) };
    }
    if (ref.startsWith('COMM-ACC-')) {
      return { sourceType: 'COMMISSION', sourceId: ref.slice(9) };
    }
    if (ref.startsWith('SALE-CONTRACT-')) {
      return { sourceType: 'TITLE_TRANSFER', sourceId: ref.slice(14) };
    }
    return {};
  }

  private classifyEntry(entry: any): string {
    const ref = (entry.reference ?? '').toLowerCase();
    const notes = (entry.notes ?? '').toLowerCase();
    if (ref.startsWith('sale-')) return 'sale';
    if (ref.startsWith('comm-pay-')) return 'disbursement';
    if (ref.startsWith('comm-') || notes.includes('commission')) return 'commission';
    if (
      ref.startsWith('ap-ap-') ||
      ref.startsWith('svc-ap-') ||
      (ref.startsWith('ap-') && notes.includes('work order'))
    )
      return 'service';
    if (ref.startsWith('disb-') || (ref.startsWith('ap-') && !ref.startsWith('ap-ap-')))
      return 'disbursement';
    if (notes.includes('work order') || notes.includes('maintenance')) return 'service';
    return 'other';
  }

  async findAllEntries(tenantId: string, query: GlEntriesQuery): Promise<GlEntriesResult> {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '50', 10) || 50));
    const search = query.search?.trim() || '';
    const fn = query.function ?? 'all';

    const where: Prisma.JournalEntryWhereInput = { tenantId };

    if (search) {
      const or: Prisma.JournalEntryWhereInput[] = [
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          lines: {
            some: {
              OR: [
                { description: { contains: search, mode: 'insensitive' } },
                { account: { accountCode: { contains: search, mode: 'insensitive' } } },
                { account: { name: { contains: search, mode: 'insensitive' } } },
              ],
            },
          },
        },
      ];
      where.OR = or;
    }

    if (fn !== 'all') {
      const refPrefixes: string[] = [];
      const notesContains: string[] = [];
      const notesNotContains: string[] = [];

      switch (fn) {
        case 'sale':
          notesContains.push('sale');
          break;
        case 'commission':
          refPrefixes.push('comm-');
          notesContains.push('commission');
          break;
        case 'service':
          refPrefixes.push('ap-ap-', 'svc-ap-');
          notesContains.push('work order', 'maintenance');
          break;
        case 'disbursement':
          refPrefixes.push('disb-', 'ap-');
          notesNotContains.push('work order', 'maintenance');
          break;
      }

      const fnOr: Prisma.JournalEntryWhereInput[] = [];
      if (refPrefixes.length > 0) {
        fnOr.push({ reference: { startsWith: refPrefixes[0], mode: 'insensitive' } });
        for (let i = 1; i < refPrefixes.length; i++) {
          fnOr.push({ reference: { startsWith: refPrefixes[i], mode: 'insensitive' } });
        }
      }
      if (notesContains.length > 0) {
        for (const nc of notesContains) {
          fnOr.push({ notes: { contains: nc, mode: 'insensitive' } });
        }
      }

      if (fnOr.length > 0) {
        if (where.AND) {
          (where.AND as Prisma.JournalEntryWhereInput[]).push({ OR: fnOr });
        } else {
          where.OR = fnOr;
        }
      }
    }

    const [data, total, summaryRows] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: { account: true },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalLine.aggregate({
        where: { journalEntry: where },
        _sum: { debitAmount: true, creditAmount: true },
      }),
    ]);

    const totalDebit = Number(summaryRows._sum.debitAmount ?? 0);
    const totalCredit = Number(summaryRows._sum.creditAmount ?? 0);

    const enriched = data.map((entry) => ({ ...entry, ...this.parseSource(entry.reference) }));

    // Resolve TITLE_TRANSFER sourceId (title number like CCT-2025-00067)
    // to a real Property ID for drill-down; populate `propertyId` on the row.
    const transferEntries = enriched.filter((e: any) => e.sourceType === 'TITLE_TRANSFER');
    if (transferEntries.length > 0) {
      const titleSet = new Set(transferEntries.map((e: any) => e.sourceId).filter(Boolean));
      if (titleSet.size > 0) {
        const transfers = await this.prisma.titleTransfer.findMany({
          where: {
            tenantId,
            titleNumber: { in: Array.from(titleSet) as string[], mode: 'insensitive' } as any,
          },
          select: { titleNumber: true, propertyId: true },
        });
        const titleToProp = new Map(
          transfers
            .filter((t: any) => t.titleNumber)
            .map((t: any) => [String(t.titleNumber).toLowerCase(), t.propertyId] as const),
        );
        for (const e of transferEntries) {
          const key = e.sourceId ? String(e.sourceId).toLowerCase() : null;
          const propId = key ? titleToProp.get(key) : null;
          if (propId) e.propertyId = propId;
        }
      }
    }

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { totalDebit, totalCredit, balance: totalDebit - totalCredit },
    };
  }

  async findAllAccounts(tenantId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { tenantId },
      orderBy: { accountCode: 'asc' },
    });
  }
}
