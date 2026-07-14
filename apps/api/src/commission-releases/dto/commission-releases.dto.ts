import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsISO8601,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const RELEASE_TYPES = [
  'full_payout',
  'partial_payout',
  'advance',
  'adjustment',
  'clawback',
] as const;
export type ReleaseTypeType = (typeof RELEASE_TYPES)[number];

export const RELEASE_STATUSES = ['pending', 'paid', 'cancelled'] as const;
export type ReleaseStatusType = (typeof RELEASE_STATUSES)[number];

export const AGING_BUCKETS = [
  'Current',
  'Bucket31_60',
  'Bucket61_90',
  'Bucket91_120',
  'Bucket120Plus',
] as const;
export type AgingBucketType = (typeof AGING_BUCKETS)[number];

export class CreateReleaseDto {
  @ApiProperty() @IsUUID() agentTransactionId: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() releaseDate?: string;
  @ApiProperty({ enum: RELEASE_TYPES }) @IsEnum(RELEASE_TYPES) releaseType: ReleaseTypeType;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateReleaseDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() amount?: number;
  @ApiPropertyOptional({ enum: RELEASE_TYPES }) @IsOptional() @IsEnum(RELEASE_TYPES) releaseType?: ReleaseTypeType;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ReleaseQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number;
  @ApiPropertyOptional() @IsUUID() @IsOptional() agentId?: string;
  @ApiPropertyOptional({ enum: AGING_BUCKETS }) @IsOptional() @IsEnum(AGING_BUCKETS) agingBucket?: AgingBucketType;
}
