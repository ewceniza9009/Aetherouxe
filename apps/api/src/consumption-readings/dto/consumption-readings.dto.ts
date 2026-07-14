import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReadingDto {
  @ApiProperty() @IsString() meterId: string;
  @ApiProperty() @IsDateString() readingDate: string;
  @ApiProperty() @IsNumber() value: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reader?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class UpdateReadingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() meterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() readingDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() value?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reader?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class ReadingQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() meterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
}
