import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@elite-realty/shared-types';

export class CreateLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class LeadQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}

export class ConvertLeadDto {
  @ApiProperty({ enum: ['tenant', 'owner'] })
  @IsEnum(['tenant', 'owner'])
  targetRole: 'tenant' | 'owner';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractType?: 'standard_rental' | 'rent_to_own' | 'spot_cash';
}
