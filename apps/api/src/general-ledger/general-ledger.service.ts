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
    // COMM-ACC-{agentId}:{txId}
    if (ref.startsWith('COMM-ACC-')) {
      const rest = ref.slice(9);
      const colon = rest.indexOf(':');
      if (colon > 0)
        return {
          sourceType: 'COMMISSION',
          sourceId: rest.slice(colon + 1),
          parentId: rest.slice(0, colon),
        };
      return { sourceType: 'COMMISSION', sourceId: rest };
    }
    if (ref.startsWith('COMM-PAY-')) return { sourceType: 'COMMISSION', sourceId: ref.slice(9) };
    if (ref.startsWith('AP-AP-')) return { sourceType: 'SERVICE_REQUEST', sourceId: ref.slice(6) };
    // SALE-CONTRACT-{propertyId}:{ttId}
    if (ref.startsWith('SALE-CONTRACT-')) {
      const rest = ref.slice(14);
      const colon = rest.indexOf(':');
      if (colon > 0)
        return {
          sourceType: 'TITLE_TRANSFER',
          sourceId: rest.slice(colon + 1),
          parentId: rest.slice(0, colon),
        };
      return { sourceType: 'TITLE_TRANSFER', sourceId: rest };
    }
    if (ref.startsWith('DISB-WO-')) return { sourceType: 'DISBURSEMENT', sourceId: ref.slice(8) };
    return {};
  }

  private classifyEntry(entry: any): string {
    const ref = (entry.reference ?? '').toLowerCase();
    const notes = (entry.notes ?? '').toLowerCase();
    if (ref.startsWith('sale-')) return 'sale';
    if (ref.startsWith('comm-') || notes.includes('commission')) return 'commission';
    if (ref.startsWith('ap-ap-') || (ref.startsWith('ap-') && notes.includes('work order')))
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
          refPrefixes.push('ap-ap-');
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
