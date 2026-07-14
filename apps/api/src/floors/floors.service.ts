import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFloorDto, UpdateFloorDto } from './dto/floors.dto';

@Injectable()
export class FloorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFloorDto) {
    if (!dto.sortOrder) {
      const last = await this.prisma.floor.findFirst({
        where: { buildingId: dto.buildingId },
        orderBy: { sortOrder: 'desc' },
      });
      dto.sortOrder = (last?.sortOrder ?? 0) + 1;
    }
    return this.prisma.floor.create({ data: dto as any, include: { units: true } });
  }

  async findByBuilding(buildingId: string) {
    return this.prisma.floor.findMany({
      where: { buildingId },
      orderBy: { sortOrder: 'asc' },
      include: { units: true },
    });
  }

  async findOne(id: string) {
    const floor = await this.prisma.floor.findUnique({ where: { id }, include: { units: true } });
    if (!floor) throw new NotFoundException('Floor not found');
    return floor;
  }

  async update(id: string, dto: UpdateFloorDto) {
    await this.findOne(id);
    return this.prisma.floor.update({ where: { id }, data: dto as any, include: { units: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.floor.delete({ where: { id } });
    return { deleted: true };
  }
}
