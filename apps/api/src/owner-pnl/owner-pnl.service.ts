import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePnlDto,
  UpdatePnlDto,
  GeneratePnlDto,
  PnlQueryDto,
} from './dto/owner-pnl.dto';

@Injectable()
export class OwnerPnlService {
  constructor(private prisma: PrismaService) {}

  async createPnl(dto: CreatePnlDto) {
    return this.prisma.ownerPnlStatement.create({
      data: {
        ownerId: dto.ownerId,
        propertyId: dto.propertyId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        grossRentalIncome: dto.grossRentalIncome ?? 0,
        totalExpenses: dto.totalExpenses ?? 0,
        managementFee: dto.managementFee ?? 0,
        netIncome: dto.netIncome ?? 0,
        yieldPct: dto.yieldPct ?? null,
        status: dto.status ?? 'draft',
      },
    });
  }

  async findAllPnl(query: PnlQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.ownerPnlStatement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
        include: { owner: true, property: true },
      }),
      this.prisma.ownerPnlStatement.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOnePnl(id: string) {
    const pnl = await this.prisma.ownerPnlStatement.findUnique({
      where: { id },
      include: { owner: true, property: true },
    });
    if (!pnl) throw new NotFoundException('Owner P&L statement not found');
    return pnl;
  }

  async updatePnl(id: string, dto: UpdatePnlDto) {
    await this.findOnePnl(id);
    return this.prisma.ownerPnlStatement.update({
      where: { id },
      data: {
        ownerId: dto.ownerId,
        propertyId: dto.propertyId,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
        grossRentalIncome: dto.grossRentalIncome,
        totalExpenses: dto.totalExpenses,
        managementFee: dto.managementFee,
        netIncome: dto.netIncome,
        yieldPct: dto.yieldPct,
        status: dto.status,
      },
    });
  }

  async removePnl(id: string) {
    await this.findOnePnl(id);
    await this.prisma.ownerPnlStatement.delete({ where: { id } });
    return { deleted: true };
  }

  async getPnlByOwner(ownerId: string) {
    return this.prisma.ownerPnlStatement.findMany({
      where: { ownerId },
      orderBy: { generatedAt: 'desc' },
      include: { property: true },
    });
  }

  async generatePnl(dto: GeneratePnlDto) {
    const owner = await this.prisma.user.findUnique({ where: { id: dto.ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');

    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);
    const feeRate = dto.managementFeeRate ?? 0.1;

    const rentalWhere: any = {
      status: { in: ['paid', 'partially_paid'] },
      OR: [
        { paymentDate: { gte: start, lte: end } },
        { createdAt: { gte: start, lte: end } },
      ],
    };
    if (dto.propertyId) rentalWhere.leaseAgreement = { propertyId: dto.propertyId };

    const payments = await this.prisma.rentalPayment.findMany({ where: rentalWhere });
    const grossRentalIncome = payments.reduce(
      (sum, p) => sum + (p.amountPaid ? Number(p.amountPaid) : 0),
      0,
    );

    const workOrderWhere: any = {
      actualCost: { not: null },
      completedDate: { gte: start, lte: end },
    };
    if (dto.propertyId) {
      workOrderWhere.serviceRequest = {
        OR: [{ propertyId: dto.propertyId }, { unit: { propertyId: dto.propertyId } }],
      };
    }

    const workOrders = await this.prisma.maintenanceWorkOrder.findMany({ where: workOrderWhere });
    const workOrderCost = workOrders.reduce(
      (sum, w) => sum + (w.actualCost ? Number(w.actualCost) : 0),
      0,
    );

    const utilityWhere: any = {
      issuedDate: { gte: start, lte: end },
    };
    if (dto.propertyId) utilityWhere.unit = { propertyId: dto.propertyId };

    const utilityBills = await this.prisma.utilityBill.findMany({ where: utilityWhere });
    const utilityCost = utilityBills.reduce((sum, u) => sum + Number(u.amountDue), 0);

    const totalExpenses = workOrderCost + utilityCost;
    const managementFee = grossRentalIncome * feeRate;
    const netIncome = grossRentalIncome - totalExpenses - managementFee;

    return this.prisma.ownerPnlStatement.create({
      data: {
        ownerId: dto.ownerId,
        propertyId: dto.propertyId,
        periodStart: start,
        periodEnd: end,
        grossRentalIncome,
        totalExpenses,
        managementFee,
        netIncome,
        yieldPct: null,
        status: 'issued',
      },
    });
  }
}
