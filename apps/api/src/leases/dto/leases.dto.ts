import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaseDto {
  @ApiProperty() @IsString() @IsUUID() propertyId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() unitId?: string;
  @ApiProperty() @IsString() @IsUUID() tenantUserId: string;
  @ApiProperty({ enum: ['standard_rental', 'rent_to_own', 'corporate_lease', 'short_term'] })
  @IsEnum(['standard_rental', 'rent_to_own', 'corporate_lease', 'short_term'])
  leaseType: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiProperty() @IsNumber() @Min(0) monthlyRentAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) securityDepositAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) latePaymentPenaltyPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) gracePeriodDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() leaseDocumentUrl?: string;
}

export class UpdateLeaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantUserId?: string;
  @ApiPropertyOptional({ enum: ['standard_rental', 'rent_to_own', 'corporate_lease', 'short_term'] })
  @IsOptional() @IsEnum(['standard_rental', 'rent_to_own', 'corporate_lease', 'short_term'])
  leaseType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() monthlyRentAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() securityDepositAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latePaymentPenaltyPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() gracePeriodDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() leaseDocumentUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class LeaseQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyType?: string;
  @ApiPropertyOptional({ enum: ['standard_rental', 'rent_to_own', 'corporate_lease', 'short_term'] })
  @IsOptional() @IsEnum(['standard_rental', 'rent_to_own', 'corporate_lease', 'short_term'])
  leaseType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() unitId?: string;
  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional() @IsEnum(['active', 'inactive'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
