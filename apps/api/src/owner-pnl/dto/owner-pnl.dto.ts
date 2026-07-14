import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PnlStatus } from '@prisma/client';

export class CreatePnlDto {
  @ApiProperty() @IsString() ownerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiProperty() @IsDateString() periodStart: string;
  @ApiProperty() @IsDateString() periodEnd: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() grossRentalIncome?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalExpenses?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() managementFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() netIncome?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() yieldPct?: number;
  @ApiPropertyOptional({ enum: PnlStatus }) @IsOptional() @IsEnum(PnlStatus) status?: PnlStatus;
}

export class UpdatePnlDto {
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() periodStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() periodEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() grossRentalIncome?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalExpenses?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() managementFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() netIncome?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() yieldPct?: number;
  @ApiPropertyOptional({ enum: PnlStatus }) @IsOptional() @IsEnum(PnlStatus) status?: PnlStatus;
}

export class GeneratePnlDto {
  @ApiProperty() @IsString() ownerId: string;
  @ApiProperty() @IsDateString() periodStart: string;
  @ApiProperty() @IsDateString() periodEnd: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() managementFeeRate?: number;
}

export class PnlQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional({ enum: PnlStatus }) @IsOptional() @IsEnum(PnlStatus) status?: PnlStatus;
}
