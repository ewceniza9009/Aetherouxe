import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  CreateCaseNoteDto,
  CaseQueryDto,
} from './dto/collection-cases.dto';

@Injectable()
export class CollectionCasesService {
  constructor(private prisma: PrismaService) {}

  private async generateCaseNumber() {
    const year = new Date().getFullYear();
    const prefix = `CC-${year}-`;
    const last = await this.prisma.collectionCase.findFirst({
      where: { caseNumber: { startsWith: prefix } },
      orderBy: { caseNumber: 'desc' },
      select: { caseNumber: true },
    });
    const lastSeq = last?.caseNumber
      ? parseInt(last.caseNumber.slice(prefix.length), 10) || 0
      : 0;
    return `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;
  }

  private async resolveTenantId(dto: CreateCaseDto) {
    if (dto.tenantId) return dto.tenantId;
    if (dto.leaseId) {
      const lease = await this.prisma.leaseAgreement.findUnique({
        where: { id: dto.leaseId },
        include: { property: true },
      });
      if (lease) return lease.property?.tenantId;
    }
    return undefined;
  }

  async create(dto: CreateCaseDto) {
    const tenantId = await this.resolveTenantId(dto);
    const caseNumber = await this.generateCaseNumber();
    return this.prisma.collectionCase.create({
      data: {
        caseNumber,
        tenantId,
        leaseId: dto.leaseId,
        totalOutstanding: dto.totalOutstanding,
        priority: dto.priority || 'medium',
        status: 'open',
        assignedToId: dto.assignedToId,
        openedAt: new Date(),
        lastActivityAt: new Date(),
        nextActionDate: dto.nextActionDate ? new Date(dto.nextActionDate) : undefined,
      },
      include: { tenant: true, lease: true, assignedTo: true },
    });
  }

  async findAll(query: CaseQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.leaseId) where.leaseId = query.leaseId;

    const [data, total] = await Promise.all([
      this.prisma.collectionCase.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: true,
          assignedTo: true,
          lease: {
            include: {
              tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
              property: { select: { id: true, propertyCode: true } },
            },
          },
        },
        orderBy: { lastActivityAt: 'desc' },
      }),
      this.prisma.collectionCase.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const collectionCase = await this.prisma.collectionCase.findUnique({
      where: { id },
      include: {
        tenant: true,
        assignedTo: true,
        lease: {
          include: {
            tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            property: { select: { id: true, propertyCode: true } },
          },
        },
        activities: { orderBy: { performedAt: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!collectionCase) throw new NotFoundException('Collection case not found');
    return collectionCase;
  }

  async update(id: string, dto: UpdateCaseDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId;
    if (dto.nextActionDate !== undefined) data.nextActionDate = new Date(dto.nextActionDate);
    if (dto.resolutionNotes !== undefined) data.resolutionNotes = dto.resolutionNotes;

    return this.prisma.collectionCase.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.collectionActivity.deleteMany({ where: { collectionCaseId: id } }),
      this.prisma.collectionCaseNote.deleteMany({ where: { caseId: id } }),
      this.prisma.arCollectionAction.deleteMany({ where: { collectionCaseId: id } }),
      this.prisma.collectionCase.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  async addNote(caseId: string, dto: CreateCaseNoteDto) {
    const collectionCase = await this.prisma.collectionCase.findUnique({ where: { id: caseId } });
    if (!collectionCase) throw new NotFoundException('Collection case not found');

    return this.prisma.collectionCaseNote.create({
      data: {
        caseId,
        authorId: dto.authorId,
        note: dto.note,
      },
    });
  }

  async getNotes(caseId: string) {
    return this.prisma.collectionCaseNote.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActivities(caseId: string) {
    return this.prisma.collectionActivity.findMany({
      where: { collectionCaseId: caseId },
      orderBy: { performedAt: 'desc' },
    });
  }

  async openForOverdue(leaseId?: string) {
    const now = new Date();
    const leaseWhere: any = {};
    if (leaseId) leaseWhere.id = leaseId;

    const leases = await this.prisma.leaseAgreement.findMany({
      where: leaseWhere,
      include: {
        property: true,
        rentalPayments: {
          where: { dueDate: { lt: now } },
        },
      },
    });

    const created: any[] = [];
    for (const lease of leases) {
      const overdue = lease.rentalPayments.filter(
        (p) => Number(p.amountDue) - Number(p.amountPaid ?? 0) > 0,
      );
      if (overdue.length === 0) continue;

      const oldest = overdue.reduce(
        (min, p) => (new Date(p.dueDate) < min ? new Date(p.dueDate) : min),
        new Date(overdue[0].dueDate),
      );
      const daysOverdue = Math.floor((now.getTime() - oldest.getTime()) / 86_400_000);
      if (daysOverdue <= 60) continue;

      const existing = await this.prisma.collectionCase.findFirst({
        where: { leaseId: lease.id, status: { in: ['open', 'in_progress', 'escalated'] } },
      });
      if (existing) continue;

      const totalOutstanding = overdue.reduce(
        (sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid ?? 0)),
        0,
      );

      const collectionCase = await this.prisma.collectionCase.create({
        data: {
          caseNumber: await this.generateCaseNumber(),
          tenantId: lease.property?.tenantId,
          leaseId: lease.id,
          totalOutstanding,
          priority: 'high',
          status: 'open',
          openedAt: now,
          lastActivityAt: now,
        },
        include: { tenant: true, lease: true, assignedTo: true },
      });
      created.push(collectionCase);
    }

    return { count: created.length, cases: created };
  }
}
