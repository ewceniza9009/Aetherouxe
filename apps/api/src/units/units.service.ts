import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from './dto/units.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUnitDto, tenantId: string) {
    if (dto.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId, tenantId },
      });
      if (!property) throw new BadRequestException('Property does not belong to your tenant');
    }

    const building = await this.prisma.building.findUnique({
      where: { id: dto.buildingId, tenantId },
    });
    if (!building) throw new BadRequestException('Building does not belong to your tenant');

    if (dto.floorId) {
      const floor = await this.prisma.floor.findUnique({
        where: { id: dto.floorId, building: { tenantId } },
      });
      if (!floor) throw new BadRequestException('Floor does not belong to your tenant');
    }

    return this.prisma.unit.create({
      data: { ...(dto as any) },
      include: { property: true, building: true, floor: true },
    });
  }

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'propertyId', type: 'eq' },
      { field: 'buildingId', type: 'eq' },
      { field: 'floorId', type: 'eq' },
      { field: 'unitType', type: 'enum' },
    ],
    sortable: ['createdAt', 'updatedAt', 'unitNumber', 'squareMeters', 'listPrice'],
  };

  async findAll(query: UnitQueryDto, tenantId: string) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    const where: any = { building: { tenantId }, ...built.where };
    if (query.propertyStatus) {
      where.property = { ...(where.property || {}), status: query.propertyStatus };
    }

    return paginate(this.prisma.unit, {
      page: query.page,
      limit: query.limit,
      where,
      include: { property: true, building: true, floor: true },
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string, tenantId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id, building: { tenantId } },
      include: { property: true, building: true, floor: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.unit.update({
      where: { id, building: { tenantId } },
      data: dto as any,
      include: { property: true, building: true, floor: true },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.unit.delete({ where: { id, building: { tenantId } } });
    return { deleted: true };
  }
}
