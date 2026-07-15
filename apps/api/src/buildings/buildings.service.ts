import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingDto, UpdateBuildingDto, BuildingQueryDto } from './dto/buildings.dto';

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBuildingDto, tenantId: string) {
    return this.prisma.building.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        name: dto.name,
        buildingType: dto.buildingType as any,
        floorCount: dto.floorCount,
        unitCount: dto.unitCount,
        address: dto.address,
      },
      include: { floors: true },
    });
  }

  async findAll(query: BuildingQueryDto, tenantId: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.building.findMany({ where, skip, take: limit, include: { floors: true } }),
      this.prisma.building.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id, tenantId },
      include: { floors: { orderBy: { sortOrder: 'asc' } }, units: { include: { floor: true, property: true } } },
    });
    if (!building) throw new NotFoundException('Building not found');
    return building;
  }

  async update(id: string, dto: UpdateBuildingDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.building.update({ where: { id, tenantId }, data: dto as any, include: { floors: true } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.floor.deleteMany({ where: { building: { tenantId }, buildingId: id } });
    await this.prisma.building.delete({ where: { id, tenantId } });
    return { deleted: true };
  }
}
