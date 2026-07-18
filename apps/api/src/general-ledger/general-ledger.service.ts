import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeneralLedgerService {
  constructor(private prisma: PrismaService) {}

  async findAllEntries(tenantId: string) {
    return this.prisma.journalEntry.findMany({
      where: { tenantId },
      include: {
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: 'desc' },
    });
  }

  async findAllAccounts(tenantId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { tenantId },
      orderBy: { accountCode: 'asc' },
    });
  }
}
