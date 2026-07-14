import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsISO8601,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const TRANSACTION_TYPES = ['sale', 'rental_lease', 'rto_contract', 'lease_renewal'] as const;
export type TransactionTypeType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  'pending',
  'approved',
  'partially_paid',
  'fully_paid',
  'disputed',
] as const;
export type TransactionStatusType = (typeof TRANSACTION_STATUSES)[number];

export class CreateTransactionDto {
  @ApiProperty() @IsUUID() agentId: string;
  @ApiProperty({ enum: TRANSACTION_TYPES }) @IsEnum(TRANSACTION_TYPES) transactionType: TransactionTypeType;
  @ApiProperty() @IsUUID() propertyId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() leaseAgreementId?: string;
  @ApiProperty() @IsNumber() transactionAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() commissionRuleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() transactionDate?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: TRANSACTION_STATUSES }) @IsOptional() @IsEnum(TRANSACTION_STATUSES) status?: TransactionStatusType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() finalCommission?: number;
}

export class TransactionQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number;
  @ApiPropertyOptional() @IsUUID() @IsOptional() agentId?: string;
  @ApiPropertyOptional({ enum: TRANSACTION_TYPES }) @IsOptional() @IsEnum(TRANSACTION_TYPES) transactionType?: TransactionTypeType;
  @ApiPropertyOptional({ enum: TRANSACTION_STATUSES }) @IsOptional() @IsEnum(TRANSACTION_STATUSES) status?: TransactionStatusType;
  @ApiPropertyOptional() @IsUUID() @IsOptional() propertyId?: string;
}
