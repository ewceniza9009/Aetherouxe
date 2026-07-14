import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQueryDto,
  CreateSignatureDto,
  UpdateSignatureDto,
} from './dto/documents.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post() @ApiOperation({ summary: 'Create a document' })
  create(@Body() dto: CreateDocumentDto) { return this.service.createDocument(dto); }

  @Get() @ApiOperation({ summary: 'List documents with filters and pagination' })
  findAll(@Query() query: DocumentQueryDto) { return this.service.findAllDocuments(query); }

  @Get('owner/:ownerType/:ownerId') @ApiOperation({ summary: 'List documents for an owner' })
  getByOwner(@Param('ownerType') ownerType: string, @Param('ownerId') ownerId: string) {
    return this.service.getDocumentsByOwner(ownerType, ownerId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get a document by ID (includes signatures)' })
  findOne(@Param('id') id: string) { return this.service.findOneDocument(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a document' })
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.service.updateDocument(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a document' })
  remove(@Param('id') id: string) { return this.service.removeDocument(id); }

  @Get(':id/signatures') @ApiOperation({ summary: 'List signatures for a document' })
  findSignatures(@Param('id') id: string) { return this.service.findAllSignatures(id); }

  @Post(':id/signatures') @ApiOperation({ summary: 'Create a signature request for a document' })
  createSignature(@Param('id') id: string, @Body() dto: CreateSignatureDto) {
    return this.service.createSignature({ ...dto, documentVaultId: id });
  }

  @Post('signatures/:sigId/mark-signed') @ApiOperation({ summary: 'Mark a signature as signed' })
  markSigned(@Param('sigId') sigId: string) { return this.service.markSignatureSigned(sigId); }

  @Get('signatures/:sigId') @ApiOperation({ summary: 'Get a signature by ID' })
  findOneSignature(@Param('sigId') sigId: string) { return this.service.findOneSignature(sigId); }

  @Patch('signatures/:sigId') @ApiOperation({ summary: 'Update a signature' })
  updateSignature(@Param('sigId') sigId: string, @Body() dto: UpdateSignatureDto) {
    return this.service.updateSignature(sigId, dto);
  }

  @Delete('signatures/:sigId') @ApiOperation({ summary: 'Delete a signature' })
  removeSignature(@Param('sigId') sigId: string) { return this.service.removeSignature(sigId); }
}
