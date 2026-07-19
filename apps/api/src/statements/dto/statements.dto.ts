import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export type StatementStatus = 'draft' | 'sent' | 'disputed';

export class CreateStatementDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiProperty() @IsDateString() periodStart: string;
  @ApiProperty() @IsDateString() periodEnd: string;
  @ApiProperty() @IsNumber() openingBalance: number;
  @ApiProperty() @IsNumber() totalBilled: number;
  @ApiProperty() @IsNumber() totalPaid: number;
  @ApiPropertyOptional({ enum: ['draft', 'sent', 'disputed'] })
  @IsOptional() @IsEnum(['draft', 'sent', 'disputed'])
  status?: StatementStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() pdfUrl?: string;
}

export class UpdateStatementDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() periodStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() periodEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() openingBalance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalBilled?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalPaid?: number;
  @ApiPropertyOptional({ enum: ['draft', 'sent', 'disputed'] })
  @IsOptional() @IsEnum(['draft', 'sent', 'disputed'])
  status?: StatementStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() pdfUrl?: string;
}

export class StatementQueryDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUUID() propertyId?: string;
  @ApiPropertyOptional({ enum: ['draft', 'sent', 'disputed'] })
  @IsOptional() @IsEnum(['draft', 'sent', 'disputed'])
  status?: StatementStatus;
}
