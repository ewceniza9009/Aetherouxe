import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  CreateLicenseRenewalDto,
  UpdateLicenseRenewalDto,
  AgentQueryDto,
} from './dto/agents.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService, private ledger: LedgerService) {}

  async create(dto: CreateAgentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.managerId) {
      const manager = await this.prisma.realEstateAgent.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) throw new NotFoundException('Manager agent not found');
    }

    return this.prisma.realEstateAgent.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        licenseNumber: dto.licenseNumber,
        tinNumber: dto.tinNumber,
        commissionRateDefault: dto.commissionRateDefault,
        tier: (dto.tier as any) || 'junior',
        managerId: dto.managerId,
        isInternal: dto.isInternal ?? true,
      },
      include: { user: true },
    });
  }

  async findAll(query: AgentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tier) where.tier = query.tier;
    if (query.isInternal !== undefined && query.isInternal !== null) {
      where.isInternal = query.isInternal;
    }
    if (query.search) {
      where.OR = [
        { licenseNumber: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.realEstateAgent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          manager: { include: { user: true } },
          subordinates: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.realEstateAgent.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const agent = await this.prisma.realEstateAgent.findUnique({
      where: { id },
      include: {
        user: true,
        manager: { include: { user: true } },
        subordinates: { include: { user: true } },
        transactions: {
          include: { commissionReleases: true, property: true },
        },
        licenseRenewals: true,
      },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);

    if (dto.managerId) {
      const manager = await this.prisma.realEstateAgent.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) throw new NotFoundException('Manager agent not found');
    }

    return this.prisma.realEstateAgent.update({
      where: { id },
      data: {
        licenseNumber: dto.licenseNumber,
        tinNumber: dto.tinNumber,
        commissionRateDefault: dto.commissionRateDefault,
        tier: dto.tier as any,
        managerId: dto.managerId,
        isInternal: dto.isInternal,
      },
      include: { user: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const txCount = await this.prisma.agentTransaction.count({ where: { agentId: id } });
    if (txCount > 0) {
      throw new BadRequestException('Cannot delete agent with existing transactions');
    }
    await this.prisma.realEstateAgent.delete({ where: { id } });
    return { deleted: true };
  }

  async createLicenseRenewal(dto: CreateLicenseRenewalDto) {
    const agent = await this.prisma.realEstateAgent.findUnique({ where: { id: dto.agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    return this.prisma.agentLicenseRenewal.create({
      data: {
        tenantId: agent.tenantId,
        agentId: dto.agentId,
        licenseNumber: dto.licenseNumber,
        licenseExpiryDate: new Date(dto.licenseExpiryDate),
        cpeUnitsCompleted: dto.cpeUnitsCompleted,
        cpeUnitsRequired: dto.cpeUnitsRequired,
        renewalStatus: dto.renewalStatus || 'compliant',
        renewalDocumentUrl: dto.renewalDocumentUrl,
        lastRenewedAt: dto.lastRenewedAt ? new Date(dto.lastRenewedAt) : null,
      },
    });
  }

  async updateLicenseRenewal(id: string, dto: UpdateLicenseRenewalDto) {
    const renewal = await this.prisma.agentLicenseRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException('License renewal not found');

    return this.prisma.agentLicenseRenewal.update({
      where: { id },
      data: {
        licenseNumber: dto.licenseNumber,
        licenseExpiryDate: dto.licenseExpiryDate ? new Date(dto.licenseExpiryDate) : undefined,
        cpeUnitsCompleted: dto.cpeUnitsCompleted,
        cpeUnitsRequired: dto.cpeUnitsRequired,
        renewalStatus: dto.renewalStatus,
        renewalDocumentUrl: dto.renewalDocumentUrl,
        lastRenewedAt: dto.lastRenewedAt ? new Date(dto.lastRenewedAt) : undefined,
      },
    });
  }

  async getLicenseRenewals(agentId: string) {
    await this.findOne(agentId);
    return this.prisma.agentLicenseRenewal.findMany({
      where: { agentId },
      orderBy: { licenseExpiryDate: 'desc' },
    });
  }

  async getPerformance(agentId: string) {
    const agent = await this.prisma.realEstateAgent.findUnique({
      where: { id: agentId },
      include: { user: true, licenseRenewals: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const transactions = await this.prisma.agentTransaction.findMany({
      where: { agentId },
      include: { commissionReleases: true },
    });

    let totalSalesVolume = 0;
    let totalCommissionEarned = 0;
    let totalCommissionPaid = 0;
    let propertiesSold = 0;
    const transactionsByType: Record<string, number> = {};

    for (const t of transactions) {
      const amount = Number(t.transactionAmount);
      totalSalesVolume += amount;

      const bal = this.ledger.commissionBalance(t);
      totalCommissionEarned += bal.owed;
      totalCommissionPaid += bal.paid;

      if (t.transactionType === 'sale' && (t.status === 'approved' || t.status === 'fully_paid' || t.status === 'partially_paid')) {
        propertiesSold += 1;
      }

      transactionsByType[t.transactionType] = (transactionsByType[t.transactionType] || 0) + 1;
    }

    const latestRenewal = agent.licenseRenewals[0];
    const licenseStatus = latestRenewal ? latestRenewal.renewalStatus : 'unknown';

    return {
      agentId,
      agentName: `${agent.user?.firstName || ''} ${agent.user?.lastName || ''}`.trim(),
      totalSalesVolume,
      totalCommissionEarned,
      totalCommissionPaid,
      propertiesSold,
      avgDaysToClose: 0,
      licenseStatus,
      transactionsByType,
    };
  }
}
