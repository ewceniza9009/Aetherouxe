import { IsString, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateScenarioDto {
  @ApiProperty() @IsString() @IsUUID() leaseAgreementId: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(100) downPaymentPercent: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(50) interestRatePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(600) loanTermMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) propertyValueAtGeneration?: number;
}

export class MortgageScenarioQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseAgreementId?: string;
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
}
