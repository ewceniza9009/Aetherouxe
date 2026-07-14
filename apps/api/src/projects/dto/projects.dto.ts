import { IsString, IsOptional, IsEnum, IsInt, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectType, ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty() @IsString() @IsUUID() tenantId: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: ProjectType })
  @IsEnum(ProjectType)
  projectType: ProjectType;
  @ApiPropertyOptional({ enum: ProjectStatus, default: 'planning' })
  @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiPropertyOptional() @IsOptional() @IsInt() totalPhases?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetStartDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetCompletionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectLogoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional() @IsEnum(ProjectType)
  projectType?: ProjectType;
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiPropertyOptional() @IsOptional() @IsInt() totalPhases?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetStartDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() targetCompletionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectLogoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class ProjectQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional() @IsEnum(ProjectType)
  projectType?: ProjectType;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
