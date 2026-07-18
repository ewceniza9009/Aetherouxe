import { IsString, IsOptional, IsEnum, IsInt, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectType, ProjectStatus } from '@prisma/client';
import { ListQueryDto } from '../../common/dto/list-query.dto';

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

export class ProjectQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional() @IsEnum(ProjectType)
  projectType?: ProjectType;
}
