import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory, Priority, ServiceStatus, WorkOrderStatus } from '@prisma/client';

export class CreateServiceRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiProperty({ enum: ServiceCategory }) @IsEnum(ServiceCategory) category: ServiceCategory;
  @ApiProperty({ enum: Priority }) @IsEnum(Priority) priority: Priority;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class UpdateServiceRequestDto {
  @ApiPropertyOptional({ enum: ServiceStatus }) @IsOptional() @IsEnum(ServiceStatus) status?: ServiceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToType?: string;
  @ApiPropertyOptional({ enum: Priority }) @IsOptional() @IsEnum(Priority) priority?: Priority;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class AssignRequestDto {
  @ApiProperty() @IsString() assignedToId: string;
  @ApiProperty() @IsString() assignedToType: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class ServiceRequestQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: ServiceStatus }) @IsOptional() @IsEnum(ServiceStatus) status?: ServiceStatus;
  @ApiPropertyOptional({ enum: Priority }) @IsOptional() @IsEnum(Priority) priority?: Priority;
  @ApiPropertyOptional({ enum: ServiceCategory }) @IsOptional() @IsEnum(ServiceCategory) category?: ServiceCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;
}

export class CreateWorkOrderDto {
  @ApiProperty() @IsString() serviceRequestId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() actualCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ enum: WorkOrderStatus }) @IsOptional() @IsEnum(WorkOrderStatus) status?: WorkOrderStatus;
}

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({ enum: WorkOrderStatus }) @IsOptional() @IsEnum(WorkOrderStatus) status?: WorkOrderStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() actualCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
