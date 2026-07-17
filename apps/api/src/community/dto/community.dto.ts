import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AmenityType,
  BookingStatus,
  PostType,
  Audience,
  ModerationStatus,
  ReportStatus,
} from '@prisma/client';

export class CreateAmenityDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: AmenityType }) @IsEnum(AmenityType) type: AmenityType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hourlyRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
}

export class UpdateAmenityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: AmenityType }) @IsOptional() @IsEnum(AmenityType) type?: AmenityType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hourlyRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
}

export class AmenityQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: AmenityType }) @IsOptional() @IsEnum(AmenityType) type?: AmenityType;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateBookingDto {
  @ApiProperty() @IsString() amenityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitLabel?: string;
  @ApiProperty() @IsDateString() bookingStart: string;
  @ApiProperty() @IsDateString() bookingEnd: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ enum: BookingStatus }) @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() bookingStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() bookingEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class BookingQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() amenityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional({ enum: BookingStatus }) @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
}

export class CreatePostDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() body: string;
  @ApiPropertyOptional({ enum: PostType }) @IsOptional() @IsEnum(PostType) postType?: PostType;
  @ApiPropertyOptional({ enum: Audience }) @IsOptional() @IsEnum(Audience) audience?: Audience;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdatePostDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional({ enum: PostType }) @IsOptional() @IsEnum(PostType) postType?: PostType;
  @ApiPropertyOptional({ enum: Audience }) @IsOptional() @IsEnum(Audience) audience?: Audience;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class PostQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: PostType }) @IsOptional() @IsEnum(PostType) postType?: PostType;
  @ApiPropertyOptional({ enum: Audience }) @IsOptional() @IsEnum(Audience) audience?: Audience;
  @ApiPropertyOptional({ enum: ModerationStatus }) @IsOptional() @IsEnum(ModerationStatus) moderationStatus?: ModerationStatus;
}

export class ModeratePostDto {
  @ApiProperty({ enum: ModerationStatus }) @IsEnum(ModerationStatus) moderationStatus: ModerationStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() moderatedById?: string;
}

// ─── Comments ───────────────────────────────
export class CreateCommentDto {
  @ApiProperty() @IsString() postId: string;
  @ApiProperty() @IsString() body: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorName?: string;
}

export class ModerateCommentDto {
  @ApiProperty({ enum: ModerationStatus }) @IsEnum(ModerationStatus) moderationStatus: ModerationStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() moderatedById?: string;
}

export class CommentQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() postId?: string;
  @ApiPropertyOptional({ enum: ModerationStatus }) @IsOptional() @IsEnum(ModerationStatus) moderationStatus?: ModerationStatus;
}

// ─── Reports ────────────────────────────────
export class CreateReportDto {
  @ApiPropertyOptional() @IsOptional() @IsString() postId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() commentId?: string;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsString() details?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportedById?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reporterName?: string;
}

export class ResolveReportDto {
  @ApiProperty({ enum: ReportStatus }) @IsEnum(ReportStatus) status: ReportStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNote?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resolvedById?: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: ReportStatus }) @IsOptional() @IsEnum(ReportStatus) status?: ReportStatus;
}
