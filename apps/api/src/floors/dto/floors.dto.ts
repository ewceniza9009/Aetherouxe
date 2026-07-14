import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFloorDto {
  @ApiProperty() @IsString() @IsUUID() buildingId: string;
  @ApiProperty() @IsString() floorNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() floorPlanUrl?: string;
}

export class UpdateFloorDto {
  @ApiPropertyOptional() @IsOptional() @IsString() floorNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() floorPlanUrl?: string;
}
