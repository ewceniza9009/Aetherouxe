import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocOwnerType, DocumentType, SignatureStatus } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocOwnerType }) @IsEnum(DocOwnerType) ownerType: DocOwnerType;
  @ApiProperty() @IsString() ownerId: string;
  @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType) documentType: DocumentType;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiProperty() @IsString() fileUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() uploadedById?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSigned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional({ enum: DocumentType }) @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}

export class DocumentQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional({ enum: DocOwnerType }) @IsOptional() @IsEnum(DocOwnerType) ownerType?: DocOwnerType;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional({ enum: DocumentType }) @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSigned?: boolean;
}

export class CreateSignatureDto {
  @ApiProperty() @IsString() documentVaultId: string;
  @ApiProperty() @IsString() signerName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signerEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signerUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatureUrl?: string;
}

export class UpdateSignatureDto {
  @ApiPropertyOptional({ enum: SignatureStatus }) @IsOptional() @IsEnum(SignatureStatus) status?: SignatureStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() signatureUrl?: string;
}
