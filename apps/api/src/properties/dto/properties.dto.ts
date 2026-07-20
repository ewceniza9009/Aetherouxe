import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty() @IsString() @IsUUID() projectId: string;
  @ApiProperty({
    enum: ['condo_unit', 'house_and_lot', 'townhouse', 'commercial_space', 'parking_slot'],
  })
  @IsIn(['condo_unit', 'house_and_lot', 'townhouse', 'commercial_space', 'parking_slot'])
  propertyType: string;
  @ApiPropertyOptional({
    enum: ['available', 'reserved', 'sold', 'rented', 'rto_active', 'under_maintenance'],
  })
  @IsOptional()
  @IsIn(['available', 'reserved', 'sold', 'rented', 'rto_active', 'under_maintenance'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentPropertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyCode?: string;
  @ApiPropertyOptional({
    description: 'Owning user. Defaults to the tenant company owner when omitted.',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  ownerId?: string;
}

export class UpdatePropertyDto {
  @ApiPropertyOptional({
    enum: ['condo_unit', 'house_and_lot', 'townhouse', 'commercial_space', 'parking_slot'],
  })
  @IsOptional()
  @IsIn(['condo_unit', 'house_and_lot', 'townhouse', 'commercial_space', 'parking_slot'])
  propertyType?: string;
  @ApiPropertyOptional({
    enum: ['available', 'reserved', 'sold', 'rented', 'rto_active', 'under_maintenance'],
  })
  @IsOptional()
  @IsIn(['available', 'reserved', 'sold', 'rented', 'rto_active', 'under_maintenance'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentPropertyId?: string;
}

export class PropertyQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() buildingId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortOrder?: string;
}
