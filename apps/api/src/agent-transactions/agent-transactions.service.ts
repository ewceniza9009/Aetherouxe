import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionsService } from '../commissions/commissions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from './dto/agent-transactions.dto';

@Injectable()
export class AgentTransactionsService {
  constructor(
    private prisma: PrismaService,
    private commissionsService: CommissionsService,
  ) {}

  async create(dto: CreateTransactionDto) {
    const agent = await this.prisma.realEstateAgent.findUnique({ where: { id: dto.agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    if (dto.leaseAgreementId) {
      const lease = await this.prisma.leaseAgreement.findUnique({
        where: { id: dto.leaseAgreementId },
      });
      if (!lease) throw new NotFoundException('Lease agreement not found');
    }

    let commissionValue: number | undefined;
    let rule: any = null;
    if (dto.commissionRuleId) {
      const commissionRule = await this.prisma.agentCommission.findUnique({
        where: { id: dto.commissionRuleId },
      });
      if (!commissionRule) throw new NotFoundException('Commission rule not found');
      rule = commissionRule;
      const leaseMonthlyRent = dto.transactionType === 'rental_lease' && dto.leaseAgreementId
        ? Number(
            (
              await this.prisma.leaseAgreement.findUnique({
                where: { id: dto.leaseAgreementId },
              })
            )?.monthlyRentAmount || 0,
          )
        : undefined;
      commissionValue = this.commissionsService.calculateCommissionForRule(
        rule,
        dto.transactionAmount,
        leaseMonthlyRent,
      );
    }

    const calculatedCommission = commissionValue ?? 0;
    const finalCommission = calculatedCommission;

    return this.prisma.agentTransaction.create({
      data: {
        agentId: dto.agentId,
        transactionType: dto.transactionType as any,
        propertyId: dto.propertyId,
        leaseAgreementId: dto.leaseAgreementId,
        transactionAmount: dto.transactionAmount,
        commissionRuleId: dto.commissionRuleId,
        calculatedCommission,
        finalCommission,
        status: 'pending',
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
      },
      include: { agent: { include: { user: true } }, property: true, commissionRule: true },
    });
  }

  async findAll(query: TransactionQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.agentId) where.agentId = query.agentId;
    if (query.transactionType) where.transactionType = query.transactionType;
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;

    const [data, total] = await Promise.all([
      this.prisma.agentTransaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          agent: { include: { user: true } },
          property: true,
          commissionRule: true,
        },
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.agentTransaction.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const tx = await this.prisma.agentTransaction.findUnique({
      where: { id },
      include: {
        agent: { include: { user: true } },
        property: true,
        leaseAgreement: true,
        commissionRule: true,
        commissionReleases: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findOne(id);
    return this.prisma.agentTransaction.update({
      where: { id },
      data: {
        status: dto.status as any,
        finalCommission: dto.finalCommission,
      },
      include: { agent: { include: { user: true } }, property: true, commissionRule: true },
    });
  }

  async approve(id: string) {
    await this.findOne(id);
    return this.prisma.agentTransaction.update({
      where: { id },
      data: { status: 'approved' },
      include: { agent: { include: { user: true } }, property: true, commissionRule: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agentTransaction.delete({ where: { id } });
    return { deleted: true };
  }

  async getByAgent(agentId: string) {
    return this.prisma.agentTransaction.findMany({
      where: { agentId },
      include: { property: true, commissionRule: true },
      orderBy: { transactionDate: 'desc' },
    });
  }
}
