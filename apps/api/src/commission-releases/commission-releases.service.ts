import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReleaseDto,
  UpdateReleaseDto,
  ReleaseQueryDto,
  PayCommissionDto,
  AgingBucketType,
} from './dto/commission-releases.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketForDays(days: number): AgingBucketType {
  if (days <= 30) return 'Current';
  if (days <= 60) return 'Bucket31_60';
  if (days <= 90) return 'Bucket61_90';
  if (days <= 120) return 'Bucket91_120';
  return 'Bucket120Plus';
}

@Injectable()
export class CommissionReleasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReleaseDto) {
    const tx = await this.prisma.agentTransaction.findUnique({
      where: { id: dto.agentTransactionId },
    });
    if (!tx) throw new NotFoundException('Agent transaction not found');

    const now = new Date();
    const releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : new Date();
    const days = Math.floor((now.getTime() - releaseDate.getTime()) / DAY_MS);
    const agingBucket = bucketForDays(days);

    const release = await this.prisma.agentCommissionRelease.create({
      data: {
        agentTransactionId: dto.agentTransactionId,
        amount: dto.amount,
        releaseDate,
        releaseType: dto.releaseType,
        agingBucket,
        paymentReference: dto.paymentReference,
        paymentMethod: dto.paymentMethod,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : releaseDate,
        status: dto.status ?? 'paid',
        approvedByUserId: dto.approvedByUserId,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
      },
      include: { transaction: { include: { agent: { include: { user: true } } } } },
    });

    await this.reconcileTransactionStatus(dto.agentTransactionId);
    return release;
  }

  /**
   * Records an actual commission disbursement to an agent and reconciles the
   * parent transaction's paid status. This is the "pay the agent" workflow.
   */
  async payCommission(agentTransactionId: string, dto: PayCommissionDto) {
    const tx = await this.prisma.agentTransaction.findUnique({
      where: { id: agentTransactionId },
      include: { agent: true }
    });
    if (!tx) throw new NotFoundException('Agent transaction not found');
    if (tx.status === 'disputed') {
      throw new BadRequestException('Cannot pay a disputed commission');
    }

    const owed = Number(tx.finalCommission ?? tx.calculatedCommission ?? 0);
    const alreadyPaid = await this.totalReleasedFor(agentTransactionId);
    const remaining = Math.max(0, owed - alreadyPaid);

    if (remaining <= 0) {
      throw new BadRequestException('This commission is already fully paid');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    if (dto.amount > remaining + 0.01) {
      throw new BadRequestException(
        `Payment (${dto.amount}) exceeds remaining balance (${remaining.toFixed(2)})`,
      );
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();
    const willBeFullyPaid = alreadyPaid + dto.amount >= owed - 0.01;
    const releaseType =
      dto.releaseType ?? (willBeFullyPaid ? 'full_payout' : 'partial_payout');

    const release = await this.prisma.agentCommissionRelease.create({
      data: {
        agentTransactionId,
        amount: dto.amount,
        releaseDate: paymentDate,
        releaseType,
        agingBucket: 'Current',
        paymentMethod: dto.paymentMethod,
        paymentDate,
        paymentReference: dto.paymentReference,
        status: 'paid',
        approvedByUserId: dto.approvedByUserId,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
      },
      include: { transaction: { include: { agent: { include: { user: true } } } } },
    });

    // GL Integration: Record Commission Expense
    const tenantId = tx.agent.tenantId;
    const commAcc = await this.prisma.chartOfAccount.findFirst({
      where: { tenantId, accountCode: '5100' }
    });
    const cashAcc = await this.prisma.chartOfAccount.findFirst({
      where: { tenantId, accountCode: '1000' }
    });
    const apAcc = await this.prisma.chartOfAccount.findFirst({
      where: { tenantId, accountCode: '2000' }
    });

    if (commAcc && cashAcc && apAcc) {
      const apInvoice = await this.prisma.apInvoice.create({
        data: {
          tenantId,
          sourceType: 'COMMISSION',
          sourceId: release.id,
          invoiceNumber: `COMM-${release.id.substring(0,8)}`,
          amount: dto.amount,
          status: 'paid',
          dueDate: paymentDate,
        }
      });

      await this.prisma.apDisbursement.create({
        data: {
          invoiceId: apInvoice.id,
          amount: dto.amount,
          notes: `Commission payout to agent. Ref: ${release.id}`,
        }
      });

      await this.prisma.journalEntry.create({
        data: {
          tenantId,
          reference: `COMM-${release.id.substring(0, 8)}`,
          notes: `Commission payout for Transaction ${tx.id}`,
          lines: {
            create: [
              { accountId: commAcc.id, debitAmount: dto.amount, description: 'Commission Expense' },
              { accountId: cashAcc.id, creditAmount: dto.amount, description: 'Cash Outflow' },
            ]
          }
        }
      });
    }

    const newStatus = await this.reconcileTransactionStatus(agentTransactionId);

    return {
      release: this.serializeRelease(release),
      transactionStatus: newStatus,
      totalPaid: alreadyPaid + dto.amount,
      owed,
      remaining: Math.max(0, owed - (alreadyPaid + dto.amount)),
    };
  }

  private async totalReleasedFor(agentTransactionId: string): Promise<number> {
    const releases = await this.prisma.agentCommissionRelease.findMany({
      where: { agentTransactionId, status: { not: 'cancelled' } },
      select: { amount: true },
    });
    return releases.reduce((sum, r) => sum + Number(r.amount), 0);
  }

  private async reconcileTransactionStatus(agentTransactionId: string) {
    const tx = await this.prisma.agentTransaction.findUnique({
      where: { id: agentTransactionId },
    });
    if (!tx) return null;
    if (tx.status === 'disputed') return tx.status;

    const owed = Number(tx.finalCommission ?? tx.calculatedCommission ?? 0);
    const paid = await this.totalReleasedFor(agentTransactionId);

    let status: string;
    if (paid <= 0) {
      status = tx.status === 'approved' ? 'approved' : 'pending';
    } else if (paid >= owed - 0.01) {
      status = 'fully_paid';
    } else {
      status = 'partially_paid';
    }

    if (status !== tx.status) {
      await this.prisma.agentTransaction.update({
        where: { id: agentTransactionId },
        data: { status: status as any },
      });
    }
    return status;
  }

  async findAll(query: ReleaseQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.agingBucket) where.agingBucket = query.agingBucket;
    if (query.agentId) {
      where.transaction = { agentId: query.agentId };
    }

    const [rows, total] = await Promise.all([
      this.prisma.agentCommissionRelease.findMany({
        where,
        skip,
        take: limit,
        include: {
          transaction: {
            include: { agent: { include: { user: true } }, property: true },
          },
        },
        orderBy: { releaseDate: 'desc' },
      }),
      this.prisma.agentCommissionRelease.count({ where }),
    ]);

    const data = rows.map((r) => this.serializeRelease(r));
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  serializeRelease(r: any) {
    return {
      ...r,
      type: r.releaseType,
      agentName: r.transaction?.agent?.user
        ? [r.transaction.agent.user.firstName, r.transaction.agent.user.lastName].filter(Boolean).join(' ') ||
          r.transaction.agent.user.email
        : null,
    };
  }

  async findOne(id: string) {
    const release = await this.prisma.agentCommissionRelease.findUnique({
      where: { id },
      include: {
        transaction: {
          include: { agent: { include: { user: true } }, property: true },
        },
      },
    });
    if (!release) throw new NotFoundException('Commission release not found');
    return this.serializeRelease(release);
  }

  async update(id: string, dto: UpdateReleaseDto) {
    const existing = await this.prisma.agentCommissionRelease.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Commission release not found');
    const updated = await this.prisma.agentCommissionRelease.update({
      where: { id },
      data: {
        amount: dto.amount,
        releaseType: dto.releaseType,
        notes: dto.notes,
      },
      include: { transaction: true },
    });
    await this.reconcileTransactionStatus(existing.agentTransactionId);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.agentCommissionRelease.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Commission release not found');
    await this.prisma.agentCommissionRelease.delete({ where: { id } });
    await this.reconcileTransactionStatus(existing.agentTransactionId);
    return { deleted: true };
  }

  async getByAgent(agentId: string) {
    const agent = await this.prisma.realEstateAgent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    const rows = await this.prisma.agentCommissionRelease.findMany({
      where: { transaction: { agentId } },
      include: { transaction: { include: { property: true } } },
      orderBy: { releaseDate: 'desc' },
    });
    return rows.map((r) => this.serializeRelease(r));
  }
}
