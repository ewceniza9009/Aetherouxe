import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtoService } from '../rto/rto.service';
import { CreateLeaseDto, UpdateLeaseDto, LeaseQueryDto } from './dto/leases.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';

@Injectable()
export class LeasesService {
  constructor(
    private prisma: PrismaService,
    private rtoService: RtoService,
  ) {}

  async create(dto: CreateLeaseDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.tenantUserId },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }
    if (dto.monthlyRentAmount < 0) {
      throw new BadRequestException('Monthly rent amount cannot be negative');
    }

    const overlapLease = await this.prisma.leaseAgreement.findFirst({
      where: {
        unitId: dto.unitId ?? undefined,
        isActive: true,
        startDate: { lte: new Date(dto.endDate) },
        endDate: { gte: new Date(dto.startDate) },
      },
    });
    if (overlapLease) {
      throw new BadRequestException(
        `Active lease already exists for this unit during the requested period (lease ${overlapLease.id}).`,
      );
    }

    const lease = await this.prisma.leaseAgreement.create({
      data: {
        propertyId: dto.propertyId,
        tenantUserId: dto.tenantUserId,
        unitId: dto.unitId,
        leaseType: dto.leaseType as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        monthlyRentAmount: dto.monthlyRentAmount,
        securityDepositAmount: dto.securityDepositAmount,
        latePaymentPenaltyPercent: dto.latePaymentPenaltyPercent,
        gracePeriodDays: dto.gracePeriodDays,
        leaseDocumentUrl: dto.leaseDocumentUrl,
      },
      include: { property: true, tenant: true },
    });

    if (dto.leaseType === 'rent_to_own') {
      await this.rtoService.createFromLease({
        id: lease.id,
        monthlyRentAmount: lease.monthlyRentAmount,
      });
    }

    return lease;
  }

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'leaseType', type: 'enum' },
      { field: 'tenantUserId', type: 'eq' },
      { field: 'unitId', type: 'eq' },
    ],
    // propertyCode lives on the related Property — buildListQuery supports
    // relation paths for search.
    search: ['property.propertyCode'],
    sortable: ['createdAt', 'updatedAt', 'monthlyRentAmount', 'startDate', 'endDate'],
  };

  /**
   * The UI presents a rich `LeaseStatus` (active/pending/expired/terminated/
   * rto_active/rto_delinquent/rto_converted) but the row only stores `isActive`
   * + `terminationDate` + a related `rtoContract`. We derive the display status
   * so it can be returned on every row and filtered server-side.
   */
  private deriveStatus(lease: any): string {
    if (lease.terminationDate) return 'terminated';
    if (lease.leaseType === 'rent_to_own') {
      const rto = lease.rtoContract;
      if (rto) {
        if (rto.status === 'defaulted') return 'rto_delinquent';
        if (rto.status === 'completed' || rto.status === 'exercised') return 'rto_converted';
      }
      return 'rto_active';
    }
    if (!lease.isActive) {
      return new Date(lease.endDate) < new Date() ? 'expired' : 'pending';
    }
    // Active but ending within the next 60 days counts as "expiring".
    const ENDS_SOON_DAYS = 60;
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysToEnd = (new Date(lease.endDate).getTime() - Date.now()) / msPerDay;
    if (daysToEnd >= 0 && daysToEnd <= ENDS_SOON_DAYS) return 'expiring';
    return 'active';
  }

  async findAll(query: LeaseQueryDto) {
    // The frontend sends the lease type under `type`; the field map filters on
    // `leaseType`. Normalize so the enum filter actually reaches the query.
    const normalized: any = { ...query };
    if (query.type) normalized.leaseType = query.type;
    const built = buildListQuery(normalized, this.fieldMap, { createdAt: 'desc' });
    const where: any = { ...built.where };

    // `active`/`inactive` map to the stored boolean; richer statuses are
    // derived and filtered in-memory after fetch (see below).
    if (query.status === 'active') where.isActive = true;
    else if (query.status === 'inactive') where.isActive = false;
    if (query.propertyType) {
      where.property = { ...(where.property || {}), propertyType: query.propertyType };
    }

    const page = Math.max(1, Math.floor(Number(query.page) || 1));
    const rawLimit = Math.floor(Number(query.limit));
    const limited = rawLimit > 0;
    const limit = limited ? Math.min(100, rawLimit) : 0;
    const skip = limited ? (page - 1) * limit : 0;

    const rows = await this.prisma.leaseAgreement.findMany({
      where,
      include: { property: true, tenant: true, mortgageScenarios: true, rtoContract: true },
      orderBy: built.orderBy,
      ...(limited ? { skip, take: limit } : {}),
    });
    const total = await this.prisma.leaseAgreement.count({ where });

    let data = rows.map((l) => ({ ...l, status: this.deriveStatus(l) }));

    // Derived status filter (only when not the simple active/inactive case).
    // `total` must reflect the post-filter count for correct paging.
    const derivedStatusFilter =
      !!query.status && query.status !== 'active' && query.status !== 'inactive';
    if (derivedStatusFilter) {
      data = data.filter((l) => l.status === query.status);
      return {
        data,
        meta: {
          page,
          limit: limited ? limit : data.length,
          total: data.length,
          totalPages: limited ? (data.length === 0 ? 1 : Math.ceil(data.length / limit)) : 1,
        },
      };
    }

    return {
      data,
      meta: {
        page,
        limit: limited ? limit : data.length,
        total: limited ? total : data.length,
        totalPages: limited ? (total === 0 ? 1 : Math.ceil(total / limit)) : 1,
      },
    };
  }

  async findOne(id: string) {
    const lease = await this.prisma.leaseAgreement.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        rentalPayments: true,
        mortgageScenarios: true,
        rtoContract: true,
      },
    });
    if (!lease) throw new NotFoundException('Lease agreement not found');
    return lease;
  }

  async update(id: string, dto: UpdateLeaseDto) {
    await this.findOne(id);
    return this.prisma.leaseAgreement.update({
      where: { id },
      data: {
        propertyId: dto.propertyId,
        tenantUserId: dto.tenantUserId,
        leaseType: dto.leaseType as any,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        monthlyRentAmount: dto.monthlyRentAmount,
        securityDepositAmount: dto.securityDepositAmount,
        latePaymentPenaltyPercent: dto.latePaymentPenaltyPercent,
        gracePeriodDays: dto.gracePeriodDays,
        leaseDocumentUrl: dto.leaseDocumentUrl,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.leaseAgreement.delete({ where: { id } });
    return { deleted: true };
  }

  async terminate(id: string, reason: string) {
    const lease = await this.findOne(id);
    if (!lease.isActive) {
      throw new BadRequestException('Lease is already terminated');
    }
    return this.prisma.leaseAgreement.update({
      where: { id },
      data: {
        isActive: false,
        terminationDate: new Date(),
        terminationReason: reason,
      },
    });
  }
}
