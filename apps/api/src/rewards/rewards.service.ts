import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(tenantId: string) {
    return this.prisma.rewardItem.findMany({
      where: { tenantId, isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
  }

  async getBalance(tenantId: string, userId: string) {
    const ledgers = await this.prisma.rewardPointLedger.findMany({
      where: { tenantId, userId },
    });

    let balance = 0;
    for (const l of ledgers) {
      if (l.transactionType === 'earned') {
        balance += l.points;
      } else if (l.transactionType === 'redeemed') {
        balance -= l.points;
      }
    }

    return { balance };
  }

  async getLedger(tenantId: string, userId: string) {
    return this.prisma.rewardPointLedger.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async redeem(tenantId: string, userId: string, rewardItemId: string) {
    const item = await this.prisma.rewardItem.findUnique({
      where: { id: rewardItemId },
    });

    if (!item || item.tenantId !== tenantId || !item.isActive) {
      throw new BadRequestException('Invalid or inactive reward item');
    }

    const { balance } = await this.getBalance(tenantId, userId);

    if (balance < item.pointsCost) {
      throw new BadRequestException('Insufficient points balance');
    }

    const ledger = await this.prisma.rewardPointLedger.create({
      data: {
        tenantId,
        userId,
        points: item.pointsCost,
        transactionType: 'redeemed',
        notes: `Redeemed: ${item.title}`,
      },
    });

    return ledger;
  }
}
