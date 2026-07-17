import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplySchemeDto {
  @ApiProperty({ description: 'Scheme template ID — drives all financial parameters' })
  @IsUUID()
  @IsNotEmpty()
  schemeId: string;

  @ApiProperty({ description: 'Unit to apply the scheme to' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Buyer / future owner' })
  @IsUUID()
  @IsNotEmpty()
  buyerUserId: string;

  @ApiProperty({ description: 'Agent facilitating this transaction' })
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @ApiPropertyOptional({ description: 'Total property/contract value' })
  @IsNumber()
  @IsOptional()
  totalContractValue?: number;

  @ApiPropertyOptional({ description: 'Override down payment % (otherwise from scheme)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  downPaymentPercent?: number;

  @ApiPropertyOptional({ description: 'Override interest rate % (otherwise from scheme)' })
  @IsNumber()
  @IsOptional()
  interestRatePercent?: number;

  @ApiPropertyOptional({ description: 'Override loan term months (otherwise from scheme)' })
  @IsNumber()
  @IsOptional()
  loanTermMonths?: number;

  @ApiPropertyOptional({ description: 'Monthly rent amount' })
  @IsNumber()
  @IsOptional()
  monthlyRentAmount?: number;

  @ApiPropertyOptional({ description: 'Override option fee amount (otherwise from scheme)' })
  @IsNumber()
  @IsOptional()
  optionFeeAmount?: number;

  @ApiPropertyOptional({ description: 'Lease start date (defaults to today)' })
  @IsString()
  @IsOptional()
  startDate?: string;
}
