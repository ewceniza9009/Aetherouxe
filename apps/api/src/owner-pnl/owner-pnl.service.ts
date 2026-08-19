import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePnlDto, UpdatePnlDto, GeneratePnlDto, PnlQueryDto } from './dto/owner-pnl.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

@Injectable()
export class OwnerPnlService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'ownerId', type: 'eq' },
      { field: 'propertyId', type: 'eq' },
      { field: 'status', type: 'enum' },
    ],
    search: ['owner.firstName', 'owner.lastName', 'property.propertyCode'],
    sortable: [
      'generatedAt',
      'periodStart',
      'periodEnd',
      'grossRentalIncome',
      'netIncome',
      'status',
      'yieldPct',
    ],
  };

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
    const built = buildListQuery(query, this.fieldMap, { generatedAt: 'desc' });
    return paginate(this.prisma.ownerPnlStatement, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      defaultSort: { generatedAt: 'desc' },
      allowedSortFields: this.fieldMap.sortable,
      include: { owner: true, property: true },
    });
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
      OR: [{ paymentDate: { gte: start, lte: end } }, { createdAt: { gte: start, lte: end } }],
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

  async getOwnerPortfolioSummary(ownerId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException(`Owner ${ownerId} not found`);
    }

    const properties = await this.prisma.property.findMany({
      where: { ownerId },
    });
    const propertyIds = properties.map((p) => p.id);

    const units = await this.prisma.unit.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        property: true,
        building: true,
        leaseAgreements: {
          where: { isActive: true },
          include: { tenant: true },
        },
      },
    });

    const totalUnits = units.length;
    const occupiedUnits = units.filter(
      (u: any) =>
        u.status === 'occupied' ||
        u.status === 'rented' ||
        (u.leaseAgreements && u.leaseAgreements.length > 0),
    ).length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const totalAssetValue = units.reduce(
      (sum: number, u: any) => sum + (u.listPrice ? Number(u.listPrice) : 3500000),
      0,
    );

    const monthlyRentalIncome = units.reduce((sum: number, u: any) => {
      const activeLease = u.leaseAgreements?.[0];
      return sum + (activeLease?.monthlyRentAmount ? Number(activeLease.monthlyRentAmount) : 0);
    }, 0);

    const annualGrossRent = monthlyRentalIncome * 12;
    const grossYieldPct =
      totalAssetValue > 0 ? Math.round((annualGrossRent / totalAssetValue) * 10000) / 100 : 7.2;

    const pnlStatements = await this.prisma.ownerPnlStatement.findMany({
      where: { ownerId },
      orderBy: { periodStart: 'desc' },
      take: 12,
    });

    const totalHistoricalNet = pnlStatements.reduce(
      (sum: number, s: any) => sum + Number(s.netIncome || 0),
      0,
    );
    const totalHistoricalGross = pnlStatements.reduce(
      (sum: number, s: any) => sum + Number(s.grossRentalIncome || 0),
      0,
    );
    const totalHistoricalExpenses = pnlStatements.reduce(
      (sum: number, s: any) => sum + Number(s.totalExpenses || 0),
      0,
    );

    const capRatePct =
      totalAssetValue > 0
        ? Math.round(((annualGrossRent * 0.85) / totalAssetValue) * 10000) / 100
        : 6.4;

    const cashflowHistory = pnlStatements.map((s: any) => ({
      id: s.id,
      period: new Date(s.periodStart).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      grossIncome: Number(s.grossRentalIncome),
      expenses: Number(s.totalExpenses) + Number(s.managementFee),
      netIncome: Number(s.netIncome),
      status: s.status,
    }));

    return {
      owner: {
        id: owner.id,
        name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email,
        email: owner.email,
        phone: owner.phone,
      },
      metrics: {
        totalAssetValue,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        monthlyRentalIncome,
        annualGrossRent,
        grossYieldPct,
        capRatePct,
        totalHistoricalNet,
        totalHistoricalGross,
        totalHistoricalExpenses,
      },
      cashflowHistory,
      units: units.map((u: any) => ({
        id: u.id,
        unitNumber: u.unitNumber,
        unitType: u.unitType,
        status: u.status,
        propertyName: u.property?.propertyCode || 'Grand Residences',
        buildingName: u.building?.name || 'Tower 1',
        floorNumber: u.floorNumber,
        listPrice: u.listPrice ? Number(u.listPrice) : null,
        activeLease: u.leaseAgreements?.[0]
          ? {
              id: u.leaseAgreements[0].id,
              tenantName: u.leaseAgreements[0].tenant
                ? `${u.leaseAgreements[0].tenant.firstName} ${u.leaseAgreements[0].tenant.lastName}`
                : 'Active Tenant',
              monthlyRent: Number(u.leaseAgreements[0].monthlyRentAmount),
              startDate: u.leaseAgreements[0].startDate,
              endDate: u.leaseAgreements[0].endDate,
            }
          : null,
      })),
    };
  }
}
