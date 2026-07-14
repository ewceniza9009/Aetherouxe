import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractorEngagementStatus } from '@prisma/client';

export class CreateEngagementDto {
  @ApiProperty() @IsString() @IsUUID() budgetLineItemId: string;
  @ApiProperty() @IsString() @IsUUID() contractorId: string;
  @ApiProperty() @IsNumber() contractAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
}

export class UpdateEngagementDto {
  @ApiPropertyOptional({ enum: ContractorEngagementStatus })
  @IsOptional() @IsEnum(ContractorEngagementStatus)
  status?: ContractorEngagementStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() contractAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
}

export class CreatePaymentDto {
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsDateString() paymentDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
