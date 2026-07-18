import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TitleTransferStatus } from '@prisma/client';
import {
  CreateTitleTransferDto,
  UpdateTitleTransferDto,
  TitleTransferQueryDto,
} from './dto/titles.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

const includeRelations = {
  property: { include: { project: true } },
  unit: true,
  lease: true,
  buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
  previousOwner: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  processedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

@Injectable()
export class TitlesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTitleTransferDto, tenantId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.titleTransfer.create({
      data: {
        tenantId,
        propertyId: dto.propertyId,
        unitId: dto.unitId ?? null,
        leaseAgreementId: dto.leaseAgreementId ?? null,
        rtoContractId: dto.rtoContractId ?? null,
        buyerUserId: dto.buyerUserId,
        previousOwnerUserId: dto.previousOwnerUserId ?? null,
        basis: dto.basis,
        status: dto.status ?? TitleTransferStatus.pending,
        titleNumber: dto.titleNumber ?? null,
        contractValue: dto.contractValue ?? null,
        amountSettled: dto.amountSettled ?? null,
        transferFeeAmount: dto.transferFeeAmount ?? null,
        titleDocumentUrl: dto.titleDocumentUrl ?? null,
        notes: dto.notes ?? null,
        processedByUserId: userId,
      },
      include: includeRelations,
    });
  }

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'propertyId', type: 'eq' },
      { field: 'buyerUserId', type: 'eq' },
      { field: 'status', type: 'eq' },
    ],
    sortable: ['requestedDate', 'completedDate', 'createdAt', 'contractValue', 'status', 'propertyId'],
    search: ['buyer.firstName', 'buyer.lastName', 'buyer.email', 'property.propertyCode'],
  };

  async findAll(query: TitleTransferQueryDto, tenantId: string) {
    const built = buildListQuery(query, this.fieldMap, { requestedDate: 'desc' });
    const where: any = { tenantId, ...built.where };
    return paginate(this.prisma.titleTransfer, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
      include: includeRelations,
    });
  }

  async findOne(id: string, tenantId: string) {
    const transfer = await this.prisma.titleTransfer.findFirst({
      where: { id, tenantId },
      include: includeRelations,
    });
    if (!transfer) throw new NotFoundException('Title transfer not found');
    return transfer;
  }

  async update(id: string, dto: UpdateTitleTransferDto, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    const willComplete =
      dto.status === TitleTransferStatus.completed &&
      existing.status !== TitleTransferStatus.completed;

    const transfer = await this.prisma.titleTransfer.update({
      where: { id },
      data: {
        status: dto.status,
        basis: dto.basis,
        titleNumber: dto.titleNumber,
        contractValue: dto.contractValue,
        amountSettled: dto.amountSettled,
        transferFeeAmount: dto.transferFeeAmount,
        titleDocumentUrl: dto.titleDocumentUrl,
        notes: dto.notes,
        completedDate: dto.completedDate
          ? new Date(dto.completedDate)
          : willComplete
            ? new Date()
            : undefined,
      },
      include: includeRelations,
    });

    if (willComplete) {
      await this.prisma.property.update({
        where: { id: transfer.propertyId },
        data: { status: 'sold' },
      });
    }

    return transfer;
  }

  async complete(id: string, tenantId: string) {
    const existing = await this.findOne(id, tenantId);
    if (existing.status === TitleTransferStatus.completed) {
      throw new BadRequestException('Title transfer is already completed');
    }
    if (existing.status === TitleTransferStatus.cancelled) {
      throw new BadRequestException('Cannot complete a cancelled transfer');
    }

    const transfer = await this.prisma.titleTransfer.update({
      where: { id },
      data: {
        status: TitleTransferStatus.completed,
        completedDate: new Date(),
      },
      include: includeRelations,
    });

    await this.prisma.property.update({
      where: { id: transfer.propertyId },
      data: { status: 'sold' },
    });

    return transfer;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.titleTransfer.delete({ where: { id } });
    return { deleted: true };
  }
}
