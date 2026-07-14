import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UtilityType } from '@prisma/client';

export class CreateMeterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiProperty({ enum: UtilityType }) @IsEnum(UtilityType) utilityType: UtilityType;
  @ApiProperty() @IsString() meterNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() multiplier?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() installationDate?: string;
}

export class UpdateMeterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional({ enum: UtilityType }) @IsOptional() @IsEnum(UtilityType) utilityType?: UtilityType;
  @ApiPropertyOptional() @IsOptional() @IsString() meterNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() multiplier?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() installationDate?: string;
}

export class MeterQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: UtilityType }) @IsOptional() @IsEnum(UtilityType) utilityType?: UtilityType;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
