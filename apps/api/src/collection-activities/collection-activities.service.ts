import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto, UpdateActivityDto, ActivityQueryDto } from './dto/collection-activities.dto';

@Injectable()
export class CollectionActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    const collectionCase = await this.prisma.collectionCase.findUnique({
      where: { id: dto.collectionCaseId },
    });
    if (!collectionCase) throw new NotFoundException('Collection case not found');

    const performedAt = dto.performedAt ? new Date(dto.performedAt) : new Date();

    const activity = await this.prisma.collectionActivity.create({
      data: {
        collectionCaseId: dto.collectionCaseId,
        activityType: dto.activityType,
        performedById: dto.performedById,
        performedAt,
        notes: dto.notes,
        outcome: dto.outcome,
        nextActionDate: dto.nextActionDate ? new Date(dto.nextActionDate) : undefined,
      },
    });

    const caseUpdate: any = { lastActivityAt: performedAt };
    if (dto.nextActionDate) caseUpdate.nextActionDate = new Date(dto.nextActionDate);
    await this.prisma.collectionCase.update({
      where: { id: dto.collectionCaseId },
      data: caseUpdate,
    });

    return activity;
  }

  async findAll(query: ActivityQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.collectionCaseId) where.collectionCaseId = query.collectionCaseId;
    if (query.activityType) where.activityType = query.activityType;

    const [data, total] = await Promise.all([
      this.prisma.collectionActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { performedAt: 'desc' },
      }),
      this.prisma.collectionActivity.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const activity = await this.prisma.collectionActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Collection activity not found');
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.collectionCaseId !== undefined) data.collectionCaseId = dto.collectionCaseId;
    if (dto.activityType !== undefined) data.activityType = dto.activityType;
    if (dto.performedById !== undefined) data.performedById = dto.performedById;
    if (dto.performedAt !== undefined) data.performedAt = new Date(dto.performedAt);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.outcome !== undefined) data.outcome = dto.outcome;
    if (dto.nextActionDate !== undefined) data.nextActionDate = new Date(dto.nextActionDate);

    return this.prisma.collectionActivity.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.collectionActivity.delete({ where: { id } });
    return { deleted: true };
  }

  async getByCase(caseId: string) {
    return this.prisma.collectionActivity.findMany({
      where: { collectionCaseId: caseId },
      orderBy: { performedAt: 'desc' },
    });
  }
}
