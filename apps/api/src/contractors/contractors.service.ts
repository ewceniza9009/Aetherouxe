import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto, UpdateContractorDto, ContractorQueryDto } from './dto/contractors.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [{ field: 'specialization', type: 'eq' }],
    search: ['companyName', 'contactPerson', 'email', 'licenseNumber'],
    sortable: ['createdAt', 'updatedAt', 'companyName', 'licenseNumber', 'specialization', 'isActive'],
  };

  async create(dto: CreateContractorDto) {
    return this.prisma.contractor.create({ data: dto as any });
  }

  async findAll(query: ContractorQueryDto) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    return paginate(this.prisma.contractor, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
      include: {
        engagements: {
          include: {
            payments: true,
            budgetLineItem: true,
          },
        },
      },
    });
    if (!contractor) throw new NotFoundException('Contractor not found');
    return contractor;
  }

  async update(id: string, dto: UpdateContractorDto) {
    await this.findOne(id);
    return this.prisma.contractor.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contractor.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }
}
