import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum SalesSchemeType {
  SALE_MORTGAGE = 'sale_mortgage',
  RENT_TO_OWN = 'rent_to_own',
  LONG_TERM_RENTAL = 'long_term_rental',
  RESERVATION = 'reservation',
}

export class ApplySchemeDto {
  @IsEnum(SalesSchemeType)
  schemeType: SalesSchemeType;

  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @IsUUID()
  @IsNotEmpty()
  buyerUserId: string;

  @IsNumber()
  @IsOptional()
  totalContractValue?: number;

  @IsNumber()
  @IsOptional()
  downPaymentPercent?: number;

  @IsNumber()
  @IsOptional()
  interestRatePercent?: number;

  @IsNumber()
  @IsOptional()
  loanTermMonths?: number;

  @IsNumber()
  @IsOptional()
  monthlyRentAmount?: number;

  @IsNumber()
  @IsOptional()
  optionFeeAmount?: number;

  @IsString()
  @IsOptional()
  startDate?: string;
}
