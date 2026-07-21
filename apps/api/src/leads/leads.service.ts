import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';
import { LeaseType } from '@prisma/client';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto, ConvertLeadDto } from './dto/leads.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'status', type: 'eq' },
      { field: 'assignedToId', type: 'eq' },
      { field: 'propertyId', type: 'eq' },
      { field: 'tenantId', type: 'eq' },
    ],
    search: ['name', 'email', 'phone', 'notes'],
    sortable: ['createdAt', 'updatedAt', 'status', 'name'],
  };

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        tenantId: dto.tenantId ?? '',
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        propertyId: dto.propertyId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async findAll(query: LeadQueryDto) {
    const built = buildListQuery(query as any, this.fieldMap, { createdAt: 'desc' });
    return paginate(this.prisma.lead, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      include: {
        property: { select: { id: true, propertyCode: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, propertyCode: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    return this.prisma.lead.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        propertyId: dto.propertyId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async convertLead(id: string, dto: ConvertLeadDto) {
    const lead = await this.findOne(id);
    if ((lead as any).convertedUserId) {
      throw new Error('Lead has already been converted to a user');
    }

    const email = lead.email || `lead-${Date.now()}@elite-realty.com`;
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('Welcome123!', 10);

    const nameParts = lead.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Atomic transaction for user creation & deal provisioning
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: lead.tenantId,
          email,
          phone: lead.phone,
          passwordHash,
          userType: dto.targetRole as any,
          firstName,
          lastName,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: 'won',
          convertedUserId: user.id,
        },
      });

      // Initiate lease or reservation if unit provided
      let deal: any = null;
      if (dto.unitId && lead.propertyId) {
        if (dto.contractType === 'standard_rental' || dto.contractType === 'rent_to_own') {
          deal = await tx.leaseAgreement.create({
            data: {
              propertyId: lead.propertyId,
              unitId: dto.unitId,
              tenantUserId: user.id,
              leaseType:
                dto.contractType === 'rent_to_own'
                  ? LeaseType.rent_to_own
                  : LeaseType.standard_rental,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              monthlyRentAmount: 25000,
              isActive: true,
            },
          });
          if (dto.contractType === 'rent_to_own') {
            await tx.rtoContract.create({
              data: {
                leaseAgreementId: deal.id,
                totalContractValue: 3500000,
                monthlyRentPortion: 20000,
                monthlyEquityPortion: 5000,
                status: 'active',
              },
            });
          }
        }
      }

      return {
        lead: updatedLead,
        user,
        deal,
        initialPassword: 'Welcome123!',
      };
    });
  }
}
