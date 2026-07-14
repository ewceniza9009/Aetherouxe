import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto, CreateLineItemDto, UpdateLineItemDto, BudgetQueryDto } from './dto/budgets.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        phaseId: dto.phaseId,
        projectId: dto.projectId,
        budgetName: dto.budgetName,
        totalBudgetAmount: dto.totalBudgetAmount,
        approvedByUserId: dto.approvedByUserId,
        versionNumber: 1,
        isCurrentVersion: true,
      },
      include: { lineItems: true },
    });
  }

  async findAll(query: BudgetQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.phaseId) where.phaseId = query.phaseId;
    const [data, total] = await Promise.all([
      this.prisma.budget.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { lineItems: true } }),
      this.prisma.budget.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const existing = await this.findOne(id);
    await this.prisma.budget.update({
      where: { id },
      data: { isCurrentVersion: false },
    });
    const lineItems = await this.prisma.budgetLineItem.findMany({ where: { budgetId: id } });
    const newBudget = await this.prisma.budget.create({
      data: {
        phaseId: existing.phaseId,
        projectId: existing.projectId,
        budgetName: dto.budgetName ?? existing.budgetName,
        totalBudgetAmount: dto.totalBudgetAmount ?? Number(existing.totalBudgetAmount),
        approvedByUserId: dto.approvedByUserId ?? existing.approvedByUserId,
        versionNumber: existing.versionNumber + 1,
        isCurrentVersion: true,
        lineItems: {
          create: lineItems.map((li) => ({
            category: li.category,
            subcategory: li.subcategory,
            plannedAmount: li.plannedAmount,
            actualAmount: li.actualAmount,
            startDate: li.startDate,
            endDate: li.endDate,
            vendorName: li.vendorName,
            notes: li.notes,
          })),
        },
      },
      include: { lineItems: true },
    });
    return newBudget;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.budget.update({
      where: { id },
      data: { isCurrentVersion: false },
    });
    return { deleted: true };
  }

  async createLineItem(budgetId: string, dto: CreateLineItemDto) {
    await this.findOne(budgetId);
    return this.prisma.budgetLineItem.create({
      data: {
        budgetId,
        category: dto.category,
        subcategory: dto.subcategory,
        plannedAmount: dto.plannedAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        vendorName: dto.vendorName,
        notes: dto.notes,
      },
    });
  }

  async updateLineItem(budgetId: string, lineItemId: string, dto: UpdateLineItemDto) {
    await this.findOne(budgetId);
    const item = await this.prisma.budgetLineItem.findFirst({
      where: { id: lineItemId, budgetId },
    });
    if (!item) throw new NotFoundException('Line item not found');
    return this.prisma.budgetLineItem.update({
      where: { id: lineItemId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async calculateBudgetHealth(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        lineItems: {
          include: {
            engagements: {
              include: { payments: true },
            },
          },
        },
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    const items = budget.lineItems.map((li) => {
      const approvedPayments = li.engagements
        .flatMap((e) => e.payments)
        .filter((p) => p.status === 'approved' || p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const actualAmount = Math.max(Number(li.actualAmount), approvedPayments);
      const plannedAmount = Number(li.plannedAmount);
      const variance = plannedAmount - actualAmount;
      const variancePercent = plannedAmount > 0 ? (variance / plannedAmount) * 100 : 0;
      const percentConsumed = plannedAmount > 0 ? (actualAmount / plannedAmount) * 100 : 0;
      const isOver90Percent = percentConsumed > 90;

      let health: 'green' | 'yellow' | 'red';
      if (variance > plannedAmount * 0.1) {
        health = 'green';
      } else if (variance >= 0) {
        health = 'yellow';
      } else {
        health = 'red';
      }

      return {
        lineItemId: li.id,
        category: li.category,
        subcategory: li.subcategory,
        plannedAmount,
        actualAmount,
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
        percentConsumed: Math.round(percentConsumed * 100) / 100,
        isOver90Percent,
        health,
        vendorName: li.vendorName,
      };
    });

    const totalPlanned = items.reduce((s, i) => s + i.plannedAmount, 0);
    const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
    const totalVariance = totalPlanned - totalActual;

    const redCount = items.filter((i) => i.health === 'red').length;
    const yellowCount = items.filter((i) => i.health === 'yellow').length;
    let overallHealth: 'green' | 'yellow' | 'red';
    if (redCount > 0) {
      overallHealth = 'red';
    } else if (yellowCount > 0) {
      overallHealth = 'yellow';
    } else {
      overallHealth = 'green';
    }

    return {
      budgetId: budget.id,
      budgetName: budget.budgetName,
      totalPlanned,
      totalActual,
      totalVariance,
      totalVariancePercent: totalPlanned > 0 ? Math.round(((totalVariance / totalPlanned) * 100) * 100) / 100 : 0,
      overallHealth,
      items,
    };
  }
}
