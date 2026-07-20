import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnerPortalService {
  constructor(private prisma: PrismaService) {}

  async getPortfolioStats(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId },
      include: {
        units: { select: { id: true, status: true } },
        leaseAgreements: {
          where: { isActive: true },
          select: { id: true, monthlyRentAmount: true },
        },
      },
    });

    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
    const occupiedUnits = properties.reduce(
      (sum, p) => sum + p.units.filter((u) => u.status === 'occupied').length,
      0,
    );
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const pnl = await this.prisma.ownerPnlStatement.findMany({
      where: { ownerId },
      select: { netIncome: true, grossRentalIncome: true, totalExpenses: true, yieldPct: true },
    });

    const totalNetIncome = pnl.reduce((sum, p) => sum + Number(p.netIncome), 0);
    const totalGrossIncome = pnl.reduce((sum, p) => sum + Number(p.grossRentalIncome), 0);
    const totalExpenses = pnl.reduce((sum, p) => sum + Number(p.totalExpenses), 0);
    const avgYield =
      pnl.length > 0 ? pnl.reduce((sum, p) => sum + Number(p.yieldPct ?? 0), 0) / pnl.length : 0;

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalNetIncome,
      totalGrossIncome,
      totalExpenses,
      avgYield: Math.round(avgYield * 100) / 100,
    };
  }

  async getMyProperties(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId },
      include: {
        project: { select: { name: true } },
        units: { select: { id: true, status: true, unitType: true } },
        leaseAgreements: {
          where: { isActive: true },
          select: { id: true, monthlyRentAmount: true },
        },
        images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p) => {
      const totalUnits = p.units.length;
      const occupiedUnits = p.units.filter((u) => u.status === 'occupied').length;
      const occupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const monthlyIncome = p.leaseAgreements.reduce(
        (sum, l) => sum + Number(l.monthlyRentAmount),
        0,
      );
      const annualNoi = monthlyIncome * 12;

      return {
        id: p.id,
        name: p.project?.name ?? p.propertyCode,
        propertyCode: p.propertyCode,
        propertyType: p.propertyType,
        status: p.status,
        totalUnits,
        occupiedUnits,
        occupancy,
        monthlyIncome,
        annualNoi,
        imageUrl: p.images[0]?.url ?? null,
      };
    });
  }

  async getMyFinancials(ownerId: string) {
    const pnl = await this.prisma.ownerPnlStatement.findMany({
      where: { ownerId },
      include: { property: { select: { propertyCode: true, propertyType: true } } },
      orderBy: { periodStart: 'desc' },
    });

    const totalRevenue = pnl.reduce((sum, p) => sum + Number(p.grossRentalIncome), 0);
    const totalExpenses = pnl.reduce((sum, p) => sum + Number(p.totalExpenses), 0);
    const totalNetIncome = pnl.reduce((sum, p) => sum + Number(p.netIncome), 0);
    const avgYield =
      pnl.length > 0 ? pnl.reduce((sum, p) => sum + Number(p.yieldPct ?? 0), 0) / pnl.length : 0;

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        totalNetIncome,
        avgYield: Math.round(avgYield * 100) / 100,
        statementCount: pnl.length,
      },
      statements: pnl.map((p) => ({
        id: p.id,
        propertyName: p.property?.propertyCode ?? '—',
        propertyType: p.property?.propertyType ?? '—',
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        grossIncome: Number(p.grossRentalIncome),
        expenses: Number(p.totalExpenses),
        netIncome: Number(p.netIncome),
        yield: Number(p.yieldPct ?? 0),
        status: p.status,
        generatedAt: p.generatedAt,
      })),
    };
  }
}
