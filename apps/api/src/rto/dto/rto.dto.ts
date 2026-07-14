import { IsString, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RtoQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({
    enum: ['active', 'grace_period', 'defaulted', 'exercised', 'completed'],
  })
  @IsOptional()
  @IsEnum(['active', 'grace_period', 'defaulted', 'exercised', 'completed'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
}

export class ExerciseOptionDto {
  @ApiProperty() @IsString() @IsUUID() userId: string;
}
