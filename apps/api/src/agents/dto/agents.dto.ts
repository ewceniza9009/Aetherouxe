import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsDate,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const AGENT_TIERS = ['junior', 'senior', 'team_lead', 'external_broker'] as const;
export type AgentTierType = (typeof AGENT_TIERS)[number];

export class CreateAgentDto {
  @ApiProperty() @IsUUID() tenantId: string;
  @ApiProperty() @IsUUID() userId: string;
  @ApiProperty() @IsString() licenseNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tinNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() commissionRateDefault?: number;
  @ApiPropertyOptional({ enum: AGENT_TIERS })
  @IsOptional() @IsEnum(AGENT_TIERS) tier?: AgentTierType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() managerId?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean() isInternal?: boolean;
}

export class UpdateAgentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() licenseNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tinNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() commissionRateDefault?: number;
  @ApiPropertyOptional({ enum: AGENT_TIERS })
  @IsOptional() @IsEnum(AGENT_TIERS) tier?: AgentTierType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() managerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isInternal?: boolean;
}

export class CreateLicenseRenewalDto {
  @ApiProperty() @IsUUID() agentId: string;
  @ApiProperty() @IsString() licenseNumber: string;
  @ApiProperty() @IsISO8601() licenseExpiryDate: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cpeUnitsCompleted?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cpeUnitsRequired?: number;
  @ApiPropertyOptional({ enum: ['compliant', 'due_soon', 'overdue', 'expired', 'pending'] })
  @IsOptional() @IsString() renewalStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() renewalDocumentUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() lastRenewedAt?: string;
}

export class UpdateLicenseRenewalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() licenseNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() licenseExpiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cpeUnitsCompleted?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cpeUnitsRequired?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() renewalStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() renewalDocumentUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() lastRenewedAt?: string;
}

export class AgentQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number;
  @ApiPropertyOptional({ enum: AGENT_TIERS }) @IsOptional() @IsEnum(AGENT_TIERS) tier?: AgentTierType;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isInternal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
