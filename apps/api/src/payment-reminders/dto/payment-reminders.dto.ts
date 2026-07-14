import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ReminderType = 'pre_due' | 'post_due' | 'final_notice';
export type ReminderChannel = 'email' | 'sms' | 'portal' | 'letter';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'acknowledged';

export class CreateReminderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() rentalPaymentId?: string;
  @ApiProperty({ enum: ['pre_due', 'post_due', 'final_notice'] })
  @IsEnum(['pre_due', 'post_due', 'final_notice'])
  type: ReminderType;
  @ApiProperty({ enum: ['email', 'sms', 'portal', 'letter'] })
  @IsEnum(['email', 'sms', 'portal', 'letter'])
  channel: ReminderChannel;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
}

export class UpdateReminderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() rentalPaymentId?: string;
  @ApiPropertyOptional({ enum: ['pre_due', 'post_due', 'final_notice'] })
  @IsOptional() @IsEnum(['pre_due', 'post_due', 'final_notice'])
  type?: ReminderType;
  @ApiPropertyOptional({ enum: ['email', 'sms', 'portal', 'letter'] })
  @IsOptional() @IsEnum(['email', 'sms', 'portal', 'letter'])
  channel?: ReminderChannel;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional({ enum: ['pending', 'sent', 'failed', 'acknowledged'] })
  @IsOptional() @IsEnum(['pending', 'sent', 'failed', 'acknowledged'])
  status?: ReminderStatus;
}

export class ReminderQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: ['pending', 'sent', 'failed', 'acknowledged'] })
  @IsOptional() @IsEnum(['pending', 'sent', 'failed', 'acknowledged'])
  status?: ReminderStatus;
  @ApiPropertyOptional({ enum: ['pre_due', 'post_due', 'final_notice'] })
  @IsOptional() @IsEnum(['pre_due', 'post_due', 'final_notice'])
  type?: ReminderType;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() leaseId?: string;
}
