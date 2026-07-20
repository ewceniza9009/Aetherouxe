import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const COMPANY_OWNER_EMAIL_PREFIX = 'portfolio@';

@Injectable()
export class CompanyOwnerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the per-tenant "company owner" user — the developer/business that
   * owns inventory which has not yet been sold/transferred to a buyer. Creates
   * the user on first use and caches its id on the Tenant row.
   */
  async getOrCreate(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (tenant.companyOwnerId) {
      const existing = await this.prisma.user.findUnique({
        where: { id: tenant.companyOwnerId },
      });
      if (existing) return existing;
    }

    const email = `${COMPANY_OWNER_EMAIL_PREFIX}${tenant.domain}`;
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          tenantId,
          email,
          phone: null,
          passwordHash: 'NOLOGIN',
          userType: 'owner',
          firstName: 'Portfolio',
          lastName: tenant.name,
          isActive: true,
          tokenVersion: 0,
        },
      });
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { companyOwnerId: user.id },
    });

    return user;
  }
}
