import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommissionDto,
  UpdateCommissionDto,
  CommissionQueryDto,
} from './dto/commissions.dto';
import { CommissionTypeType } from './dto/commissions.dto';

export interface CommissionRuleLike {
  commissionType: CommissionTypeType;
  commissionValue: number | { toNumber(): number } | any;
}

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommissionDto) {
    return this.prisma.agentCommission.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        agentTier: dto.agentTier as any,
        propertyType: dto.propertyType as any,
        projectId: dto.projectId,
        commissionType: dto.commissionType as any,
        commissionValue: dto.commissionValue,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      },
    });
  }

  async findAll(query: CommissionQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.agentTier) where.agentTier = query.agentTier;
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.isActive !== undefined && query.isActive !== null) where.isActive = query.isActive;

    const [data, total] = await Promise.all([
      this.prisma.agentCommission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agentCommission.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const commission = await this.prisma.agentCommission.findUnique({
      where: { id },
      include: { transactions: { include: { agent: { include: { user: true } } } } },
    });
    if (!commission) throw new NotFoundException('Commission rule not found');
    return commission;
  }

  async update(id: string, dto: UpdateCommissionDto) {
    await this.findOne(id);
    return this.prisma.agentCommission.update({
      where: { id },
      data: {
        name: dto.name,
        agentTier: dto.agentTier as any,
        propertyType: dto.propertyType as any,
        projectId: dto.projectId,
        commissionType: dto.commissionType as any,
        commissionValue: dto.commissionValue,
        isActive: dto.isActive,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agentCommission.delete({ where: { id } });
    return { deleted: true };
  }

  calculateCommissionForRule(
    rule: CommissionRuleLike,
    transactionAmount: number,
    leaseMonthlyRent?: number,
  ): number {
    const value =
      typeof rule.commissionValue === 'object' && rule.commissionValue !== null
        ? Number(rule.commissionValue.toString())
        : Number(rule.commissionValue);

    switch (rule.commissionType) {
      case 'flat_amount':
        return value;
      case 'percentage_of_sale':
        return Number(transactionAmount) * (value / 100);
      case 'percentage_of_rent':
        return Number(leaseMonthlyRent ?? transactionAmount) * (value / 100);
      case 'tiered':
        return Number(transactionAmount) * (value / 100);
      default:
        return 0;
    }
  }
}
