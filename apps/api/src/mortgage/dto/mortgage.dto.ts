import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateScenarioDto {
  @ApiProperty() @IsString() @IsUUID() leaseAgreementId: string;
  @ApiProperty() @IsNumber() downPaymentPercent: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() interestRatePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() loanTermMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() propertyValueAtGeneration?: number;
}

export class MortgageScenarioQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseAgreementId?: string;
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
}
