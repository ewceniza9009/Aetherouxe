import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingDto, UpdateBuildingDto, BuildingQueryDto, CreateFloorDto, UpdateFloorDto } from './dto/buildings.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

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

  private readonly fieldMap: FieldMap = {
    filters: [{ field: 'projectId', type: 'eq' }],
    search: ['name'],
    sortable: ['createdAt', 'updatedAt', 'name', 'floorCount', 'unitCount'],
    sortAliases: { type: 'buildingType' },
  };

  async findAll(query: BuildingQueryDto, tenantId: string) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    const where: any = { tenantId, ...built.where };
    return paginate(this.prisma.building, {
      page: query.page,
      limit: query.limit,
      where,
      include: { floors: true, project: true, _count: { select: { units: true } } },
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
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

  private async assertBuilding(buildingId: string, tenantId: string) {
    const building = await this.prisma.building.findUnique({ where: { id: buildingId, tenantId } });
    if (!building) throw new NotFoundException('Building not found');
    return building;
  }

  private serializeFloor(floor: any) {
    const parsed = Number(floor.floorNumber);
    return {
      id: floor.id,
      buildingId: floor.buildingId,
      floorNumber: Number.isNaN(parsed) ? floor.floorNumber : parsed,
      sortOrder: floor.sortOrder,
      floorPlanUrl: floor.floorPlanUrl ?? null,
      unitsCount: floor._count?.units ?? 0,
      createdAt: floor.createdAt ?? null,
      updatedAt: floor.updatedAt ?? null,
    };
  }

  async findFloors(buildingId: string, tenantId: string) {
    await this.assertBuilding(buildingId, tenantId);
    const floors = await this.prisma.floor.findMany({
      where: { buildingId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { units: true } } },
    });
    return floors.map((f) => this.serializeFloor(f));
  }

  async createFloor(buildingId: string, dto: CreateFloorDto, tenantId: string) {
    await this.assertBuilding(buildingId, tenantId);
    const count = await this.prisma.floor.count({ where: { buildingId } });
    const floor = await this.prisma.floor.create({
      data: {
        buildingId,
        floorNumber: String(dto.floorNumber),
        sortOrder: dto.sortOrder ?? count + 1,
        floorPlanUrl: dto.floorPlanUrl,
      },
      include: { _count: { select: { units: true } } },
    });
    return this.serializeFloor(floor);
  }

  async updateFloor(buildingId: string, floorId: string, dto: UpdateFloorDto, tenantId: string) {
    await this.assertBuilding(buildingId, tenantId);
    const existing = await this.prisma.floor.findFirst({ where: { id: floorId, buildingId } });
    if (!existing) throw new NotFoundException('Floor not found');
    const data: any = {};
    if (dto.floorNumber !== undefined) data.floorNumber = String(dto.floorNumber);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.floorPlanUrl !== undefined) data.floorPlanUrl = dto.floorPlanUrl;
    const floor = await this.prisma.floor.update({
      where: { id: floorId },
      data,
      include: { _count: { select: { units: true } } },
    });
    return this.serializeFloor(floor);
  }

  async removeFloor(buildingId: string, floorId: string, tenantId: string) {
    await this.assertBuilding(buildingId, tenantId);
    const existing = await this.prisma.floor.findFirst({ where: { id: floorId, buildingId } });
    if (!existing) throw new NotFoundException('Floor not found');
    await this.prisma.floor.delete({ where: { id: floorId } });
    return { deleted: true };
  }
}
