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
        commissionValue: String(dto.commissionValue),
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

    const [rows, total] = await Promise.all([
      this.prisma.agentCommission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agentCommission.count({ where }),
    ]);

    const data = rows.map((r) => this.serializeRule(r));
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  serializeRule(r: any) {
    return {
      ...r,
      tier: r.agentTier,
      type: r.commissionType,
      value:
        typeof r.commissionValue === 'string'
          ? this.parseTieredBrackets(r.commissionValue) ?? r.commissionValue
          : r.commissionValue,
      status: r.isActive ? 'active' : 'inactive',
    };
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
        commissionValue: String(dto.commissionValue),
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

  private parseTieredBrackets(
    value: any,
  ): { upto: number | null; rate: number }[] | null {
    if (Array.isArray(value)) return value as any[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  calculateCommissionForRule(
    rule: CommissionRuleLike,
    transactionAmount: number,
    leaseMonthlyRent?: number,
  ): number {
    const raw = rule.commissionValue;
    const value = Number(raw);
    const brackets = this.parseTieredBrackets(raw);

    switch (rule.commissionType) {
      case 'flat_amount':
        return value;
      case 'percentage_of_sale':
        return Number(transactionAmount) * (value / 100);
      case 'percentage_of_rent': {
        const rent = Number(leaseMonthlyRent ?? 0);
        if (!rent || rent <= 0) return 0;
        return rent * (value / 100);
      }
      case 'tiered': {
        if (brackets && brackets.length > 0) {
          const amount = Number(transactionAmount);
          let prevUpto = 0;
          let commission = 0;
          for (const bracket of brackets) {
            const upper =
              bracket.upto == null ? Infinity : Number(bracket.upto);
            const rate = Number(bracket.rate);
            if (amount > prevUpto) {
              const portion = Math.min(amount, upper) - prevUpto;
              if (portion > 0) commission += portion * (rate / 100);
            }
            prevUpto = upper;
          }
          return commission;
        }
        // plain number fallback -> percentage_of_sale behavior
        return Number(transactionAmount) * (value / 100);
      }
      default:
        return 0;
    }
  }

  async resolveCommissionRule(
    tenantId: string,
    propertyType?: string,
    projectId?: string,
    agentTier?: string,
    transactionType?: string,
  ) {
    const now = new Date();
    const candidates = await this.prisma.agentCommission.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { effectiveFrom: null, effectiveUntil: null },
          { effectiveFrom: { lte: now }, effectiveUntil: null },
          { effectiveFrom: null, effectiveUntil: { gte: now } },
          { effectiveFrom: { lte: now }, effectiveUntil: { gte: now } },
        ],
      },
    });

    let best: any = null;
    let bestScore = -1;
    for (const c of candidates) {
      let score = 0;
      let matches = true;
      if (c.projectId) {
        if (c.projectId !== projectId) matches = false;
        else score += 3;
      }
      if (c.propertyType) {
        if (c.propertyType !== propertyType) matches = false;
        else score += 2;
      }
      if (c.agentTier) {
        if (c.agentTier !== agentTier) matches = false;
        else score += 1;
      }
      if (matches && score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }
}
