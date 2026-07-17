import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TitleTransferBasis, TitleTransferStatus } from '@prisma/client';

export class CreateTitleTransferDto {
  @ApiProperty()
  @IsUUID()
  propertyId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leaseAgreementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rtoContractId?: string;

  @ApiProperty()
  @IsUUID()
  buyerUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  previousOwnerUserId?: string;

  @ApiProperty({ enum: TitleTransferBasis })
  @IsEnum(TitleTransferBasis)
  basis!: TitleTransferBasis;

  @ApiPropertyOptional({ enum: TitleTransferStatus })
  @IsOptional()
  @IsEnum(TitleTransferStatus)
  status?: TitleTransferStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  contractValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountSettled?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  transferFeeAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleDocumentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTitleTransferDto {
  @ApiPropertyOptional({ enum: TitleTransferStatus })
  @IsOptional()
  @IsEnum(TitleTransferStatus)
  status?: TitleTransferStatus;

  @ApiPropertyOptional({ enum: TitleTransferBasis })
  @IsOptional()
  @IsEnum(TitleTransferBasis)
  basis?: TitleTransferBasis;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  contractValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountSettled?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  transferFeeAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleDocumentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TitleTransferQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buyerUserId?: string;

  @ApiPropertyOptional({ enum: TitleTransferStatus })
  @IsOptional()
  @IsEnum(TitleTransferStatus)
  status?: TitleTransferStatus;
}
