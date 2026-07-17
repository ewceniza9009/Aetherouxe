import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min } from 'class-validator';

export enum SchemeType {
  STANDARD_RENTAL = 'standard_rental',
  SPOT_CASH = 'spot_cash',
  INSTALLMENT = 'installment',
  MORTGAGE_ASSISTED = 'mortgage_assisted',
  RENT_TO_OWN = 'rent_to_own',
}

export class CreateSchemeDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiProperty({ enum: SchemeType }) @IsEnum(SchemeType) schemeType: SchemeType;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;

  // Standard Rental
  @ApiPropertyOptional() @IsOptional() @IsNumber() securityDepositPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() penaltyPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() graceDays?: number;

  // Spot Cash
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountPercent?: number;

  // Installment
  @ApiPropertyOptional() @IsOptional() @IsNumber() dpNumberOfPayments?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dpNumberOfDaysFromDp?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dpAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() dpRemarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqNumberOfPayments?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqNumberOfDaysFromDp?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqPaymentPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqDownpaymentPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqMonthlyAmortPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqDiscountPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqPaymentOrderNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() eqRemarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blNumberOfPayments?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blNumberOfDaysFromDp?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blPaymentPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blMiscPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() blIsChangeOrder?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() blIncludeDpAmort?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() blRemarks?: string;

  // Mortgage Assisted
  @ApiPropertyOptional() @IsOptional() @IsNumber() mortgageDownPaymentPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() interestRatePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() loanTermMonths?: number;

  // Rent-to-Own
  @ApiPropertyOptional() @IsOptional() @IsNumber() optionFeePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() equityAccumulationPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() targetPurchaseYears?: number;

  // Commissions
  @ApiPropertyOptional() @IsOptional() @IsNumber() agentCommissionPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() companyCommissionPercentage?: number;
}

export class UpdateSchemeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsNumber() securityDepositPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() penaltyPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() graceDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dpNumberOfPayments?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dpNumberOfDaysFromDp?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dpAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() dpRemarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqNumberOfPayments?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqNumberOfDaysFromDp?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqPaymentPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqDownpaymentPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqMonthlyAmortPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqDiscountPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eqPaymentOrderNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() eqRemarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blNumberOfPayments?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blNumberOfDaysFromDp?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blPaymentPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() blMiscPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() blIsChangeOrder?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() blIncludeDpAmort?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() blRemarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() mortgageDownPaymentPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() interestRatePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() loanTermMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() optionFeePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() equityAccumulationPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() targetPurchaseYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() agentCommissionPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() companyCommissionPercentage?: number;
}
