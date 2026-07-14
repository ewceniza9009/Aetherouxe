import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetCategory } from '@prisma/client';

export class CreateBudgetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() phaseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() projectId?: string;
  @ApiProperty() @IsString() budgetName: string;
  @ApiProperty() @IsNumber() totalBudgetAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() approvedByUserId?: string;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() budgetName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalBudgetAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() approvedByUserId?: string;
}

export class CreateLineItemDto {
  @ApiProperty({ enum: BudgetCategory })
  @IsEnum(BudgetCategory)
  category: BudgetCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory?: string;
  @ApiProperty() @IsNumber() plannedAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateLineItemDto {
  @ApiPropertyOptional({ enum: BudgetCategory })
  @IsOptional() @IsEnum(BudgetCategory)
  category?: BudgetCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() plannedAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class BudgetQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() phaseId?: string;
}
