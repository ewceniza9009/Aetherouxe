import { IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRentalPaymentDto {
  @ApiProperty() @IsString() @IsUUID() leaseAgreementId: string;
  @ApiProperty() @IsDateString() billingPeriodStart: string;
  @ApiProperty() @IsDateString() billingPeriodEnd: string;
  @ApiProperty() @IsDateString() dueDate: string;
  @ApiProperty() @IsNumber() amountDue: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentReference?: string;
}

export class RecordPaymentDto {
  @ApiProperty() @IsNumber() amountPaid: number;
  @ApiProperty() @IsDateString() paymentDate: string;
  @ApiProperty() @IsString() paymentMethod: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentReference?: string;
}

export class RentalPaymentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseAgreementId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
}
