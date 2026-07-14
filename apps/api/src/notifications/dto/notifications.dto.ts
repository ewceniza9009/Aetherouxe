import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationRole } from '@prisma/client';

export class MarkReadDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class MarkAllReadDto {
  @IsEnum(NotificationRole)
  role: NotificationRole;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class NotificationsQueryDto {
  @IsEnum(NotificationRole)
  role: NotificationRole;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}
