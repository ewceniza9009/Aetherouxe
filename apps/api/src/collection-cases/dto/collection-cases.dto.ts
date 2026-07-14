import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CollectionCaseStatus =
  | 'open'
  | 'in_progress'
  | 'escalated'
  | 'resolved'
  | 'written_off';
export type CollectionCasePriority = 'low' | 'medium' | 'high' | 'critical';

export class CreateCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseId?: string;
  @ApiProperty() @IsNumber() totalOutstanding: number;
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional() @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: CollectionCasePriority;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() nextActionDate?: string;
}

export class UpdateCaseDto {
  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'escalated', 'resolved', 'written_off'] })
  @IsOptional() @IsEnum(['open', 'in_progress', 'escalated', 'resolved', 'written_off'])
  status?: CollectionCaseStatus;
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional() @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: CollectionCasePriority;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() nextActionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNotes?: string;
}

export class CreateCaseNoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() authorId?: string;
  @ApiProperty() @IsString() note: string;
}

export class CaseQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'escalated', 'resolved', 'written_off'] })
  @IsOptional() @IsEnum(['open', 'in_progress', 'escalated', 'resolved', 'written_off'])
  status?: CollectionCaseStatus;
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional() @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: CollectionCasePriority;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseId?: string;
}
