import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtoService } from '../rto/rto.service';
import { CreateLeaseDto, UpdateLeaseDto, LeaseQueryDto } from './dto/leases.dto';

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

  async findAll(query: LeaseQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.leaseType) where.leaseType = query.leaseType;
    if (query.tenantUserId) where.tenantUserId = query.tenantUserId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    if (query.propertyType) where.property = { propertyType: query.propertyType };
    if (query.search) where.property = { ...(where.property || {}), propertyCode: { contains: query.search, mode: 'insensitive' } };

    const [data, total] = await Promise.all([
      this.prisma.leaseAgreement.findMany({
        where,
        skip,
        take: limit,
        include: { property: true, tenant: true, mortgageScenarios: true, rtoContract: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaseAgreement.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
