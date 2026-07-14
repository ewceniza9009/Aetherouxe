import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStatementDto, UpdateStatementDto, StatementQueryDto } from './dto/statements.dto';

@Injectable()
export class StatementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStatementDto) {
    const openingBalance = dto.openingBalance;
    const totalBilled = dto.totalBilled;
    const totalPaid = dto.totalPaid;
    const closingBalance = openingBalance + totalBilled - totalPaid;

    const data: any = {
      tenantId: dto.tenantId,
      ownerId: dto.ownerId,
      propertyId: dto.propertyId,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      openingBalance,
      totalBilled,
      totalPaid,
      closingBalance,
      status: dto.status || 'draft',
      pdfUrl: dto.pdfUrl,
    };

    return this.prisma.statementOfAccount.create({ data });
  }

  async findAll(query: StatementQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.statementOfAccount.findMany({
        where,
        skip,
        take: limit,
        include: { tenant: true, owner: true, property: true },
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.statementOfAccount.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const statement = await this.prisma.statementOfAccount.findUnique({
      where: { id },
      include: { tenant: true, owner: true, property: true },
    });
    if (!statement) throw new NotFoundException('Statement of account not found');
    return statement;
  }

  async update(id: string, dto: UpdateStatementDto) {
    const existing = await this.findOne(id);

    const openingBalance = dto.openingBalance ?? Number(existing.openingBalance);
    const totalBilled = dto.totalBilled ?? Number(existing.totalBilled);
    const totalPaid = dto.totalPaid ?? Number(existing.totalPaid);
    const closingBalance = openingBalance + totalBilled - totalPaid;

    const data: any = { closingBalance };
    if (dto.tenantId !== undefined) data.tenantId = dto.tenantId;
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId;
    if (dto.propertyId !== undefined) data.propertyId = dto.propertyId;
    if (dto.periodStart !== undefined) data.periodStart = new Date(dto.periodStart);
    if (dto.periodEnd !== undefined) data.periodEnd = new Date(dto.periodEnd);
    if (dto.openingBalance !== undefined) data.openingBalance = dto.openingBalance;
    if (dto.totalBilled !== undefined) data.totalBilled = dto.totalBilled;
    if (dto.totalPaid !== undefined) data.totalPaid = dto.totalPaid;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.pdfUrl !== undefined) data.pdfUrl = dto.pdfUrl;

    return this.prisma.statementOfAccount.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.statementOfAccount.delete({ where: { id } });
    return { deleted: true };
  }

  async generateForTenant(tenantId: string, periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const leases = await this.prisma.leaseAgreement.findMany({
      where: { property: { tenantId } },
      select: { id: true },
    });
    const leaseIds = leases.map((l) => l.id);
    if (leaseIds.length === 0) {
      throw new NotFoundException('No leases found for the given tenant');
    }

    const [prior, billed, paid] = await Promise.all([
      this.prisma.rentalPayment.findMany({
        where: {
          leaseAgreementId: { in: leaseIds },
          dueDate: { lt: start },
        },
      }),
      this.prisma.rentalPayment.findMany({
        where: {
          leaseAgreementId: { in: leaseIds },
          billingPeriodStart: { gte: start, lte: end },
        },
      }),
      this.prisma.rentalPayment.findMany({
        where: {
          leaseAgreementId: { in: leaseIds },
          paymentDate: { gte: start, lte: end },
        },
      }),
    ]);

    const openingBalance = prior.reduce(
      (sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid ?? 0)),
      0,
    );
    const totalBilled = billed.reduce((sum, p) => sum + Number(p.amountDue), 0);
    const totalPaid = paid.reduce((sum, p) => sum + Number(p.amountPaid ?? 0), 0);
    const closingBalance = openingBalance + totalBilled - totalPaid;

    return this.prisma.statementOfAccount.create({
      data: {
        tenantId,
        periodStart: start,
        periodEnd: end,
        openingBalance,
        totalBilled,
        totalPaid,
        closingBalance,
        status: 'sent',
      },
      include: { tenant: true, owner: true, property: true },
    });
  }
}
