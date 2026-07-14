import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from './dto/units.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUnitDto) {
    await this.prisma.property.findUniqueOrThrow({ where: { id: dto.propertyId } });
    await this.prisma.building.findUniqueOrThrow({ where: { id: dto.buildingId } });
    await this.prisma.floor.findUniqueOrThrow({ where: { id: dto.floorId } });
    return this.prisma.unit.create({
      data: dto as any,
      include: { property: true, building: true, floor: true },
    });
  }

  async findAll(query: UnitQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
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

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { property: true, building: true, floor: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prisma.unit.update({
      where: { id },
      data: dto as any,
      include: { property: true, building: true, floor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.unit.delete({ where: { id } });
    return { deleted: true };
  }
}
