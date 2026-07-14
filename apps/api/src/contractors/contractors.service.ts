import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto, UpdateContractorDto, ContractorQueryDto } from './dto/contractors.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractorDto) {
    return this.prisma.contractor.create({ data: dto as any });
  }

  async findAll(query: ContractorQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.specialization) where.specialization = query.specialization;
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.contractor.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.contractor.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
