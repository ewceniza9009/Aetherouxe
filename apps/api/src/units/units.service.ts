import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from './dto/units.dto';

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

  async findAll(query: UnitQueryDto, tenantId: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { building: { tenantId } };
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.buildingId) where.buildingId = query.buildingId;
    if (query.floorId) where.floorId = query.floorId;
    if (query.unitType) where.unitType = query.unitType;
    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        include: { property: true, building: true, floor: true },
      }),
      this.prisma.unit.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
