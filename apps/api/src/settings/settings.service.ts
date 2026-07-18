import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../images/s3.service';
import { UpdateSettingsDto } from './dto/settings.dto';

interface CompanySettings {
  legalName?: string;
  tradeName?: string;
  tin?: string;
  secRegistration?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

interface BrandingSettings {
  primaryColor?: string;
  accentColor?: string;
  theme?: string;
  logoUrl?: string;
}

export interface AppSettings {
  company: CompanySettings;
  locale: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStartMonth: number;
  branding: BrandingSettings;
  features?: Record<string, boolean>;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async uploadLogo(tenantId: string, file: any): Promise<{ logoUrl: string }> {
    if (!file) throw new BadRequestException('File is required');
    const folder = `tenants/${tenantId}/branding`;
    const result = await this.s3.upload(file, folder);
    
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: result.url },
    });
    
    return { logoUrl: result.url };
  }

  async getSettings(tenantId: string): Promise<AppSettings> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const raw = (tenant.settings as Partial<AppSettings>) ?? {};
    return {
      company: raw.company ?? {},
      locale: raw.locale ?? 'en-PH',
      currency: raw.currency ?? 'PHP',
      currencySymbol: raw.currencySymbol ?? '₱',
      timezone: raw.timezone ?? 'Asia/Manila',
      dateFormat: raw.dateFormat ?? 'MMM DD, YYYY',
      fiscalYearStartMonth: raw.fiscalYearStartMonth ?? 1,
      branding: {
        ...(raw.branding ?? {}),
        logoUrl: tenant.logoUrl ?? undefined,
      },
      features: raw.features ?? {},
    };
  }

  async updateSettings(tenantId: string, dto: UpdateSettingsDto): Promise<AppSettings> {
    const current = await this.getSettings(tenantId);
    const merged: AppSettings = {
      company: {
        ...current.company,
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.tradeName !== undefined && { tradeName: dto.tradeName }),
        ...(dto.tin !== undefined && { tin: dto.tin }),
        ...(dto.secRegistration !== undefined && { secRegistration: dto.secRegistration }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.website !== undefined && { website: dto.website }),
      },
      locale: dto.locale ?? current.locale,
      currency: dto.currency ?? current.currency,
      currencySymbol: dto.currencySymbol ?? current.currencySymbol,
      timezone: dto.timezone ?? current.timezone,
      dateFormat: dto.dateFormat ?? current.dateFormat,
      fiscalYearStartMonth: dto.fiscalYearStartMonth ?? current.fiscalYearStartMonth,
      branding: {
        ...current.branding,
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.theme !== undefined && { theme: dto.theme }),
      },
      features: current.features,
    };

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: merged as any },
    });
    const saved = (tenant.settings as Partial<AppSettings>) ?? {};
    return {
      company: saved.company ?? {},
      locale: saved.locale ?? 'en-PH',
      currency: saved.currency ?? 'PHP',
      currencySymbol: saved.currencySymbol ?? '₱',
      timezone: saved.timezone ?? 'Asia/Manila',
      dateFormat: saved.dateFormat ?? 'MMM DD, YYYY',
      fiscalYearStartMonth: saved.fiscalYearStartMonth ?? 1,
      branding: saved.branding ?? {},
      features: saved.features ?? {},
    };
  }
}
