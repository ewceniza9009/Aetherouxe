import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto/scheme.dto';

@Injectable()
export class SchemesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string) {
    const where: any = {};
    if (type) where.schemeType = type;
    return this.prisma.scheme.findMany({ where, orderBy: { code: 'asc' } });
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
