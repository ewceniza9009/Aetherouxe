import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReleaseDto,
  UpdateReleaseDto,
  ReleaseQueryDto,
  AgingBucketType,
} from './dto/commission-releases.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketForDays(days: number): AgingBucketType {
  if (days <= 30) return 'Current';
  if (days <= 60) return 'Bucket31_60';
  if (days <= 90) return 'Bucket61_90';
  if (days <= 120) return 'Bucket91_120';
  return 'Bucket120Plus';
}

@Injectable()
export class CommissionReleasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReleaseDto) {
    const tx = await this.prisma.agentTransaction.findUnique({
      where: { id: dto.agentTransactionId },
    });
    if (!tx) throw new NotFoundException('Agent transaction not found');

    const now = new Date();
    const releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : new Date();
    const days = Math.floor((now.getTime() - releaseDate.getTime()) / DAY_MS);
    const agingBucket = bucketForDays(days);

    return this.prisma.agentCommissionRelease.create({
      data: {
        agentTransactionId: dto.agentTransactionId,
        amount: dto.amount,
        releaseDate,
        releaseType: dto.releaseType,
        agingBucket,
        paymentReference: dto.paymentReference,
        notes: dto.notes,
      },
      include: { transaction: { include: { agent: { include: { user: true } } } } },
    });
  }

  async findAll(query: ReleaseQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.agingBucket) where.agingBucket = query.agingBucket;
    if (query.agentId) {
      where.transaction = { agentId: query.agentId };
    }

    const [data, total] = await Promise.all([
      this.prisma.agentCommissionRelease.findMany({
        where,
        skip,
        take: limit,
        include: {
          transaction: {
            include: { agent: { include: { user: true } }, property: true },
          },
        },
        orderBy: { releaseDate: 'desc' },
      }),
      this.prisma.agentCommissionRelease.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const release = await this.prisma.agentCommissionRelease.findUnique({
      where: { id },
      include: {
        transaction: {
          include: { agent: { include: { user: true } }, property: true },
        },
      },
    });
    if (!release) throw new NotFoundException('Commission release not found');
    return release;
  }

  async update(id: string, dto: UpdateReleaseDto) {
    await this.findOne(id);
    return this.prisma.agentCommissionRelease.update({
      where: { id },
      data: {
        amount: dto.amount,
        releaseType: dto.releaseType,
        notes: dto.notes,
      },
      include: { transaction: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agentCommissionRelease.delete({ where: { id } });
    return { deleted: true };
  }

  async getByAgent(agentId: string) {
    const agent = await this.prisma.realEstateAgent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    return this.prisma.agentCommissionRelease.findMany({
      where: { transaction: { agentId } },
      include: { transaction: { include: { property: true } } },
      orderBy: { releaseDate: 'desc' },
    });
  }
}
