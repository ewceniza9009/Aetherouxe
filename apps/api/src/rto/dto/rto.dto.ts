import { IsString, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class RtoQueryDto extends ListQueryDto {
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
