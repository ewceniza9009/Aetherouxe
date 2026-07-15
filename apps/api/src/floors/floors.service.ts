import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFloorDto, UpdateFloorDto } from './dto/floors.dto';

@Injectable()
export class FloorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFloorDto, tenantId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: dto.buildingId, tenantId },
    });
    if (!building) throw new BadRequestException('Building does not belong to your tenant');

    if (!dto.sortOrder) {
      const last = await this.prisma.floor.findFirst({
        where: { buildingId: dto.buildingId, building: { tenantId } },
        orderBy: { sortOrder: 'desc' },
      });
      dto.sortOrder = (last?.sortOrder ?? 0) + 1;
    }
    return this.prisma.floor.create({ data: dto as any, include: { units: true } });
  }

  async findByBuilding(buildingId: string, tenantId: string) {
    return this.prisma.floor.findMany({
      where: { buildingId, building: { tenantId } },
      orderBy: { sortOrder: 'asc' },
      include: { units: true },
    });
  }

  async findOne(id: string, tenantId: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id, building: { tenantId } },
      include: { units: true },
    });
    if (!floor) throw new NotFoundException('Floor not found');
    return floor;
  }

  async update(id: string, dto: UpdateFloorDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.floor.update({
      where: { id, building: { tenantId } },
      data: dto as any,
      include: { units: true },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.floor.delete({ where: { id, building: { tenantId } } });
    return { deleted: true };
  }
}
