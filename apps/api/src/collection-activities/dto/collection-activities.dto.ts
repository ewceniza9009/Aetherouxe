import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CollectionActivityType =
  | 'call'
  | 'email'
  | 'letter'
  | 'visit'
  | 'payment_promise'
  | 'legal_notice';

export class CreateActivityDto {
  @ApiProperty() @IsString() @IsUUID() collectionCaseId: string;
  @ApiProperty({ enum: ['call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice'] })
  @IsEnum(['call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice'])
  activityType: CollectionActivityType;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() performedById?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() performedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() outcome?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() nextActionDate?: string;
}

export class UpdateActivityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() collectionCaseId?: string;
  @ApiPropertyOptional({ enum: ['call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice'] })
  @IsOptional() @IsEnum(['call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice'])
  activityType?: CollectionActivityType;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() performedById?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() performedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() outcome?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() nextActionDate?: string;
}

export class ActivityQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() collectionCaseId?: string;
  @ApiPropertyOptional({ enum: ['call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice'] })
  @IsOptional() @IsEnum(['call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice'])
  activityType?: CollectionActivityType;
}
