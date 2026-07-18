import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto/scheme.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate, ListQueryDto } from '../common/dto/list-query.dto';

@Injectable()
export class SchemesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [{ field: 'schemeType', type: 'enum' }],
    search: ['code', 'name'],
    sortable: ['code', 'name', 'createdAt', 'updatedAt'],
    sortAliases: { type: 'schemeType' },
  };

  async findAll(query: ListQueryDto) {
    const built = buildListQuery(query, this.fieldMap, { code: 'asc' });
    return paginate(this.prisma.scheme, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string) {
    const scheme = await this.prisma.scheme.findUnique({ where: { id } });
    if (!scheme) throw new NotFoundException('Scheme not found');
    return scheme;
  }

  async create(dto: CreateSchemeDto) {
    const existing = await this.prisma.scheme.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Scheme code "${dto.code}" already exists`);
    return this.prisma.scheme.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateSchemeDto) {
    await this.findOne(id);
    if (dto.code) {
      const dup = await this.prisma.scheme.findFirst({ where: { code: dto.code, id: { not: id } } });
      if (dup) throw new ConflictException(`Scheme code "${dto.code}" already exists`);
    }
    return this.prisma.scheme.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scheme.delete({ where: { id } });
  }

  async getStats() {
    const total = await this.prisma.scheme.count();
    const byType = await this.prisma.scheme.groupBy({ by: ['schemeType'], _count: true });
    return { total, byType };
  }
}
