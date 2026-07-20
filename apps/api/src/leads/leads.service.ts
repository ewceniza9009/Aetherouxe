import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/leads.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'status', type: 'eq' },
      { field: 'assignedToId', type: 'eq' },
      { field: 'propertyId', type: 'eq' },
      { field: 'tenantId', type: 'eq' },
    ],
    search: ['name', 'email', 'phone', 'notes'],
    sortable: ['createdAt', 'updatedAt', 'status', 'name'],
  };

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        tenantId: dto.tenantId ?? '',
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        propertyId: dto.propertyId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async findAll(query: LeadQueryDto) {
    const built = buildListQuery(query as any, this.fieldMap, { createdAt: 'desc' });
    return paginate(this.prisma.lead, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      include: {
        property: { select: { id: true, propertyCode: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, propertyCode: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    return this.prisma.lead.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        propertyId: dto.propertyId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }
}
