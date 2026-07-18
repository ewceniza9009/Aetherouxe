import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillStatus } from '@prisma/client';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class CreateBillDto {
  @ApiProperty() @IsString() meterId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiProperty() @IsDateString() billingPeriodStart: string;
  @ApiProperty() @IsDateString() billingPeriodEnd: string;
  @ApiProperty() @IsNumber() previousReading: number;
  @ApiProperty() @IsNumber() currentReading: number;
  @ApiProperty() @IsNumber() ratePerUnit: number;
  @ApiPropertyOptional({ enum: BillStatus }) @IsOptional() @IsEnum(BillStatus) status?: BillStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateBillDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(BillStatus) status?: BillStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() ratePerUnit?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() currentReading?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() previousReading?: number;
}

export class BillQueryDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() meterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() utilityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
}

export class GenerateBillsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiProperty() @IsDateString() billingPeriodStart: string;
  @ApiProperty() @IsDateString() billingPeriodEnd: string;
  @ApiProperty() @IsNumber() ratePerUnit: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
}
