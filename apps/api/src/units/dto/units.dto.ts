import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiProperty() @IsString() @IsUUID() buildingId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() floorId?: string;
  @ApiProperty() @IsString() unitNumber: string;
  @ApiProperty({ enum: ['studio', 'one_br', 'two_br', 'three_br', 'penthouse', 'commercial', 'parking'] })
  @IsEnum(['studio', 'one_br', 'two_br', 'three_br', 'penthouse', 'commercial', 'parking'])
  unitType: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() squareMeters?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bedrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bathrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasBalcony?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasParking?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() facingDirection?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() listPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lotValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() buildingValue?: number;
}

export class UpdateUnitDto {
  @ApiPropertyOptional() @IsOptional() @IsString() unitNumber?: string;
  @ApiPropertyOptional({ enum: ['studio', 'one_br', 'two_br', 'three_br', 'penthouse', 'commercial', 'parking'] })
  @IsOptional() @IsEnum(['studio', 'one_br', 'two_br', 'three_br', 'penthouse', 'commercial', 'parking'])
  unitType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() squareMeters?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bedrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bathrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasBalcony?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasParking?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() facingDirection?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() listPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lotValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() buildingValue?: number;
}

export class UnitQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() buildingId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() floorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyStatus?: string;
}
