import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ description: 'Unit to reserve' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Scheme template that drives the option/reservation fee' })
  @IsUUID()
  @IsNotEmpty()
  schemeId: string;

  @ApiProperty({ description: 'Prospect full name' })
  @IsString()
  @IsNotEmpty()
  prospectName: string;

  @ApiPropertyOptional({ description: 'Prospect phone/email' })
  @IsString()
  @IsOptional()
  prospectContact?: string;

  @ApiPropertyOptional({ description: 'Days the hold is valid for (defaults to 30)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  holdDays?: number;

  @ApiPropertyOptional({ description: 'Contract value override for fee computation' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalContractValue?: number;

  @ApiPropertyOptional({
    description: 'Collect the option/reservation fee now (creates an AR invoice)',
  })
  @IsOptional()
  collectFeeNow?: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateReservationDto {
  @ApiPropertyOptional({ description: 'Extend hold by N days from now' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  extendDays?: number;

  @ApiPropertyOptional({ description: 'New hold expiry date (ISO)' })
  @IsString()
  @IsOptional()
  holdExpiry?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConvertReservationDto {
  @ApiProperty({ description: 'User performing the conversion' })
  @IsUUID()
  @IsNotEmpty()
  performedByUserId: string;

  @ApiProperty({ description: 'Buyer / future owner (user id)' })
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

  @ApiPropertyOptional({ description: 'Monthly rent amount (required for rent-to-own conversion)' })
  @IsNumber()
  @IsOptional()
  monthlyRentAmount?: number;
}

export class ReservationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by unit' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsEnum(['reserved', 'converted', 'expired', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by tenant' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
