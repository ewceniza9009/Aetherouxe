import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsISO8601,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const PROPERTY_TYPES = [
  'condo_unit',
  'house_and_lot',
  'townhouse',
  'commercial_space',
  'parking_slot',
] as const;
export type PropertyTypeType = (typeof PROPERTY_TYPES)[number];

export const COMMISSION_TYPES = [
  'flat_amount',
  'percentage_of_sale',
  'percentage_of_rent',
  'tiered',
] as const;
export type CommissionTypeType = (typeof COMMISSION_TYPES)[number];

export const AGENT_TIERS = ['junior', 'senior', 'team_lead', 'external_broker'] as const;
export type AgentTierType = (typeof AGENT_TIERS)[number];

export class CreateCommissionDto {
  @ApiProperty() @IsUUID() tenantId: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional({ enum: AGENT_TIERS }) @IsOptional() @IsEnum(AGENT_TIERS) agentTier?: AgentTierType;
  @ApiPropertyOptional({ enum: PROPERTY_TYPES }) @IsOptional() @IsEnum(PROPERTY_TYPES) propertyType?: PropertyTypeType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiProperty({ enum: COMMISSION_TYPES }) @IsEnum(COMMISSION_TYPES) commissionType: CommissionTypeType;
  @ApiProperty({ description: 'Scalar value (number) or a JSON string of tiered brackets' }) commissionValue: number | string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() effectiveUntil?: string;
}

export class UpdateCommissionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: AGENT_TIERS }) @IsOptional() @IsEnum(AGENT_TIERS) agentTier?: AgentTierType;
  @ApiPropertyOptional({ enum: PROPERTY_TYPES }) @IsOptional() @IsEnum(PROPERTY_TYPES) propertyType?: PropertyTypeType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional({ enum: COMMISSION_TYPES }) @IsOptional() @IsEnum(COMMISSION_TYPES) commissionType?: CommissionTypeType;
  @ApiPropertyOptional({ description: 'Scalar value (number) or a JSON string of tiered brackets' }) @IsOptional() commissionValue?: number | string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() effectiveUntil?: string;
}

export class CommissionQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number;
  @ApiPropertyOptional({ enum: AGENT_TIERS }) @IsOptional() @IsEnum(AGENT_TIERS) agentTier?: AgentTierType;
  @ApiPropertyOptional({ enum: PROPERTY_TYPES }) @IsOptional() @IsEnum(PROPERTY_TYPES) propertyType?: PropertyTypeType;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
