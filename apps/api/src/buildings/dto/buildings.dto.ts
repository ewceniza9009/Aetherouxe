import { IsString, IsOptional, IsEnum, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBuildingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['tower', 'mid_rise', 'low_rise', 'cluster', 'block'] })
  @IsEnum(['tower', 'mid_rise', 'low_rise', 'cluster', 'block'])
  buildingType: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() floorCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() unitCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class UpdateBuildingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: ['tower', 'mid_rise', 'low_rise', 'cluster', 'block'] })
  @IsOptional() @IsEnum(['tower', 'mid_rise', 'low_rise', 'cluster', 'block'])
  buildingType?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() floorCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() unitCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class BuildingQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
