import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  private generateFallbackCode(): string {
    return 'PROP-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  async create(dto: CreatePropertyDto, tenantId: string) {
    const code =
      dto.propertyCode ||
      this.numberingEngine.generatePropertyCode({
        projectCode: 'PRJ',
        buildingCode: 'BLD',
        unitNumber: String(Date.now()).slice(-6),
      });

    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidateCode = attempt === 0 ? code : this.generateFallbackCode();
      try {
        return await this.prisma.property.create({
          data: {
            tenantId,
            projectId: dto.projectId,
            propertyCode: candidateCode,
            propertyType: dto.propertyType as any,
            status: (dto.status as any) || 'available',
            parentPropertyId: dto.parentPropertyId,
          },
          include: { project: true, units: { include: { building: true, floor: true } } },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async findAll(query: PropertyQueryDto, tenantId: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.status) where.status = query.status;
    if (query.projectId) where.projectId = query.projectId;
    if (query.search) where.propertyCode = { contains: query.search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: { project: true, _count: { select: { units: true } } },
        orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder || 'asc' } : { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id, tenantId },
      include: { project: true, units: { include: { building: true, floor: true } }, childProperties: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.property.update({ where: { id, tenantId }, data: dto as any });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.property.update({ where: { id, tenantId }, data: { status: 'under_maintenance' } });
    return { deleted: true };
  }

  async getSpecs(propertyId: string, tenantId: string) {
    await this.findOne(propertyId, tenantId);
    return this.propertySpecService.findByPropertyId(propertyId);
  }

  async updateSpecs(propertyId: string, data: { specs?: any; metadata?: any }, tenantId: string) {
    await this.findOne(propertyId, tenantId);
    return this.propertySpecService.upsert(propertyId, data);
  }
}
