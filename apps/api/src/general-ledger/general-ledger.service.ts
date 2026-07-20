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

@Injectable()
export class GeneralLedgerService {
  constructor(private prisma: PrismaService) {}

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

    return {
      data,
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
