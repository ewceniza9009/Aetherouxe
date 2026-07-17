import { IsString, IsOptional, IsEnum, IsInt, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhaseStatus } from '@prisma/client';

export class CreatePhaseDto {
  @ApiProperty() @IsString() @IsUUID() projectId: string;
  @ApiProperty() @IsString() phaseName: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() phaseOrder?: number;
  @ApiProperty({ enum: PhaseStatus })
  @IsEnum(PhaseStatus)
  status: PhaseStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetEnd?: string;
}

export class UpdatePhaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() phaseName?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() phaseOrder?: number;
  @ApiPropertyOptional({ enum: PhaseStatus })
  @IsOptional() @IsEnum(PhaseStatus)
  status?: PhaseStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() actualStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() actualEnd?: string;
}

export class PhaseQueryDto {
  @ApiProperty() @IsString() @IsUUID() projectId: string;
}
