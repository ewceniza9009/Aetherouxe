import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto } from './dto/utility-meters.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

@Injectable()
export class UtilityMetersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMeterDto) {
    const existing = await this.prisma.utilityMeter.findUnique({
      where: { meterNumber: dto.meterNumber },
    });
    if (existing) throw new ConflictException('Meter number already exists');

    return this.prisma.utilityMeter.create({
      data: {
        tenantId: dto.tenantId,
        unitId: dto.unitId,
        propertyId: dto.propertyId,
        utilityType: dto.utilityType,
        meterNumber: dto.meterNumber,
        multiplier: dto.multiplier ?? 1,
        isActive: dto.isActive ?? true,
        installationDate: dto.installationDate ? new Date(dto.installationDate) : null,
      },
    });
  }

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'utilityType', type: 'eq' },
      { field: 'unitId', type: 'eq' },
      { field: 'propertyId', type: 'eq' },
      { field: 'tenantId', type: 'eq' },
      { field: 'isActive', type: 'bool' },
    ],
    sortable: ['createdAt', 'updatedAt', 'utilityType', 'isActive', 'serialNumber'],
  };

  async findAll(query: MeterQueryDto) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    const { data: rows, meta } = await paginate(this.prisma.utilityMeter, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
      include: {
        unit: true,
        property: true,
        tenant: true,
        _count: { select: { readings: true } },
      },
    });

    const data = await this.attachResidents(rows);
    return { data, meta };
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
    const meter = await this.prisma.utilityMeter.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
        tenant: true,
        readings: { orderBy: { readingDate: 'desc' }, take: 10 },
        bills: { orderBy: { issuedDate: 'desc' }, take: 10 },
      },
    });
    if (!meter) throw new NotFoundException('Utility meter not found');
    const [withResident] = await this.attachResidents([meter]);
    return withResident;
  }

  async update(id: string, dto: UpdateMeterDto) {
    await this.findOne(id);

    if (dto.meterNumber) {
      const existing = await this.prisma.utilityMeter.findUnique({
        where: { meterNumber: dto.meterNumber },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Meter number already exists');
      }
    }

    return this.prisma.utilityMeter.update({
      where: { id },
      data: {
        tenantId: dto.tenantId,
        unitId: dto.unitId,
        propertyId: dto.propertyId,
        utilityType: dto.utilityType,
        meterNumber: dto.meterNumber,
        multiplier: dto.multiplier,
        isActive: dto.isActive,
        installationDate: dto.installationDate ? new Date(dto.installationDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.utilityMeter.delete({ where: { id } });
    return { deleted: true };
  }
}

