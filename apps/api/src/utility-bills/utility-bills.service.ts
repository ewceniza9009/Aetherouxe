import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto, UpdateBillDto, BillQueryDto, GenerateBillsDto } from './dto/utility-bills.dto';

@Injectable()
export class UtilityBillsService {
  constructor(private prisma: PrismaService) {}

  private async assertMeter(meterId: string) {
    const meter = await this.prisma.utilityMeter.findUnique({ where: { id: meterId } });
    if (!meter) throw new NotFoundException('Utility meter not found');
    return meter;
  }

  computeBill(consumption: number, ratePerUnit: number, baseCharge: number) {
    const amountDue = consumption * ratePerUnit + baseCharge;
    return { amountDue };
  }

  private calcConsumption(
    meter: { multiplier: number },
    previousReading: number,
    currentReading: number,
  ) {
    return Math.max(0, currentReading - previousReading) * meter.multiplier;
  }

  private async resolveRate(
    tenantId: string | null | undefined,
    meterType: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    if (!tenantId) return null;
    return this.prisma.utilityRate.findFirst({
      where: {
        tenantId,
        meterType: meterType as any,
        effectiveFrom: { lte: periodEnd },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: periodStart } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async create(dto: CreateBillDto) {
    const meter = await this.assertMeter(dto.meterId);
    const periodStart = new Date(dto.billingPeriodStart);
    const periodEnd = new Date(dto.billingPeriodEnd);

    const rate = await this.resolveRate(
      dto.tenantId ?? meter.tenantId,
      meter.utilityType,
      periodStart,
      periodEnd,
    );

    const ratePerUnit =
      dto.ratePerUnit ?? (rate ? Number(rate.ratePerUnit) : 0);
    const baseCharge = rate ? Number(rate.baseCharge) : 0;

    const consumption = this.calcConsumption(
      meter,
      dto.previousReading,
      dto.currentReading,
    );
    const { amountDue } = this.computeBill(consumption, ratePerUnit, baseCharge);

    return this.prisma.utilityBill.create({
      data: {
        meterId: dto.meterId,
        tenantId: dto.tenantId,
        unitId: dto.unitId,
        propertyId: dto.propertyId,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        previousReading: dto.previousReading,
        currentReading: dto.currentReading,
        consumption,
        ratePerUnit,
        amountDue,
        status: dto.status ?? 'pending',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
      },
    });
  }

  async findAll(query: BillQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.meterId) where.meterId = query.meterId;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.utilityType) where.meter = { utilityType: query.utilityType };
    if (query.fromDate || query.toDate) {
      where.issuedDate = {};
      if (query.fromDate) where.issuedDate.gte = new Date(query.fromDate);
      if (query.toDate) where.issuedDate.lte = new Date(query.toDate);
    }

    const [rows, total] = await Promise.all([
      this.prisma.utilityBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedDate: 'desc' },
        include: { meter: true, tenant: true, unit: true },
      }),
      this.prisma.utilityBill.count({ where }),
    ]);

    const data = await this.attachResidents(
      rows.map((b) => ({
        ...b,
        periodStart: b.billingPeriodStart,
        periodEnd: b.billingPeriodEnd,
      })),
    );

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async attachResidents(rows: any[]) {
    const unitIds = [...new Set(rows.map((r) => r.unitId).filter(Boolean))];
    const leases = unitIds.length
      ? await this.prisma.leaseAgreement.findMany({
          where: { unitId: { in: unitIds }, isActive: true },
          include: { tenant: true },
        })
      : [];
    const byUnit = new Map(leases.map((l) => [l.unitId, l]));
    return rows.map((r) => {
      const lease = r.unitId ? byUnit.get(r.unitId) : null;
      const u = lease?.tenant;
      return {
        ...r,
        resident: u
          ? {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
            }
          : null,
      };
    });
  }

  async findOne(id: string) {
    const bill = await this.prisma.utilityBill.findUnique({
      where: { id },
      include: {
        meter: true,
        tenant: true,
        unit: true,
        property: true,
        readings: true,
      },
    });
    if (!bill) throw new NotFoundException('Utility bill not found');
    return bill;
  }

  async update(id: string, dto: UpdateBillDto) {
    const bill = await this.prisma.utilityBill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Utility bill not found');

    const previousReading = dto.previousReading ?? bill.previousReading;
    const currentReading = dto.currentReading ?? bill.currentReading;

    const meter = await this.assertMeter(bill.meterId);
    const periodStart = bill.billingPeriodStart;
    const periodEnd = bill.billingPeriodEnd;

    const rate = await this.resolveRate(
      bill.tenantId,
      meter.utilityType,
      periodStart,
      periodEnd,
    );

    const ratePerUnit = dto.ratePerUnit ?? (rate ? Number(rate.ratePerUnit) : Number(bill.ratePerUnit));
    const baseCharge = rate ? Number(rate.baseCharge) : 0;

    const consumption = this.calcConsumption(meter, previousReading, currentReading);
    const { amountDue } = this.computeBill(consumption, ratePerUnit, baseCharge);

    return this.prisma.utilityBill.update({
      where: { id },
      data: {
        previousReading: dto.previousReading,
        currentReading: dto.currentReading,
        ratePerUnit,
        consumption,
        amountDue,
        status: dto.status,
        notes: dto.notes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.utilityBill.delete({ where: { id } });
    return { deleted: true };
  }

  async getByTenant(tenantId: string) {
    return this.prisma.utilityBill.findMany({
      where: { tenantId },
      orderBy: { issuedDate: 'desc' },
      include: { meter: true },
    });
  }

  async markPaid(id: string) {
    await this.findOne(id);
    return this.prisma.utilityBill.update({
      where: { id },
      data: { status: 'paid' },
    });
  }

  async generateForPeriod(dto: GenerateBillsDto) {
    if (!dto.propertyId && !dto.unitId) {
      throw new BadRequestException('propertyId or unitId is required');
    }

    const meterWhere: any = { isActive: true };
    if (dto.propertyId) meterWhere.propertyId = dto.propertyId;
    if (dto.unitId) meterWhere.unitId = dto.unitId;

    const meters = await this.prisma.utilityMeter.findMany({ where: meterWhere });
    if (meters.length === 0) return { count: 0 };

    const start = new Date(dto.billingPeriodStart);
    const end = new Date(dto.billingPeriodEnd);

    const created: { meterId: string; previousReading: number; currentReading: number; consumption: number; ratePerUnit: number; amountDue: number }[] = [];

    for (const meter of meters) {
      const prevReading = await this.prisma.consumptionReading.findFirst({
        where: { meterId: meter.id, readingDate: { lte: start } },
        orderBy: { readingDate: 'desc' },
      });
      const currReading = await this.prisma.consumptionReading.findFirst({
        where: { meterId: meter.id, readingDate: { lte: end } },
        orderBy: { readingDate: 'desc' },
      });

      const previousValue = prevReading?.value ?? meter.lastReadingValue;
      const currentValue = currReading?.value ?? meter.lastReadingValue;
      if (previousValue === null || previousValue === undefined) continue;
      if (currentValue === null || currentValue === undefined) continue;
      if (currentValue < previousValue) continue;

      const rate = await this.resolveRate(meter.tenantId, meter.utilityType, start, end);
      const ratePerUnit =
        dto.ratePerUnit ?? (rate ? Number(rate.ratePerUnit) : 0);
      const baseCharge = rate ? Number(rate.baseCharge) : 0;

      const consumption = this.calcConsumption(meter, previousValue, currentValue);
      const { amountDue } = this.computeBill(consumption, ratePerUnit, baseCharge);

      created.push({
        meterId: meter.id,
        previousReading: previousValue,
        currentReading: currentValue,
        consumption,
        ratePerUnit,
        amountDue,
      });
    }

    if (created.length === 0) return { count: 0 };

    let count = 0;
    for (const c of created) {
      await this.prisma.utilityBill.create({
        data: {
          meterId: c.meterId,
          tenantId: meters.find((m) => m.id === c.meterId)?.tenantId ?? null,
          unitId: meters.find((m) => m.id === c.meterId)?.unitId ?? null,
          propertyId: meters.find((m) => m.id === c.meterId)?.propertyId ?? null,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          previousReading: c.previousReading,
          currentReading: c.currentReading,
          consumption: c.consumption,
          ratePerUnit: c.ratePerUnit,
          amountDue: c.amountDue,
          status: 'pending',
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        },
      });
      count++;
    }

    return { count };
  }
}

