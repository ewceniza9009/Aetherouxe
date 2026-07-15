import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingEngineService } from '../numbering-engine/numbering-engine.service';
import { PropertySpecService } from '../mongodb/property-spec.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from './dto/properties.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private numberingEngine: NumberingEngineService,
    private propertySpecService: PropertySpecService,
  ) {}

  async create(dto: CreatePropertyDto) {
    const code = dto.propertyCode || this.numberingEngine.generatePropertyCode({
      projectCode: 'PRJ',
      buildingCode: 'BLD',
      unitNumber: String(Date.now()).slice(-6),
    });
    return this.prisma.property.create({
      data: {
        tenantId: dto.tenantId,
        propertyCode: code,
        propertyType: dto.propertyType as any,
        status: (dto.status as any) || 'available',
        parentPropertyId: dto.parentPropertyId,
      },
      include: { units: { include: { building: true, floor: true } } },
    });
  }

  async findAll(query: PropertyQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.status) where.status = query.status;
    if (query.search) where.propertyCode = { contains: query.search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { units: true } } },
        orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder || 'asc' } : { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { units: { include: { building: true, floor: true } }, childProperties: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOne(id);
    return this.prisma.property.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.property.update({ where: { id }, data: { status: 'under_maintenance' } });
    return { deleted: true };
  }

  async getSpecs(propertyId: string) {
    await this.findOne(propertyId);
    return this.propertySpecService.findByPropertyId(propertyId);
  }

  async updateSpecs(propertyId: string, data: { specs?: any; metadata?: any }) {
    await this.findOne(propertyId);
    return this.propertySpecService.upsert(propertyId, data);
  }
}
