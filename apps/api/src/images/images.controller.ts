import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImagesService } from './images.service';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('property/:propertyId')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload property image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, alt: { type: 'string' }, isPrimary: { type: 'boolean' } } } })
  async uploadPropertyImage(
    @Param('propertyId') propertyId: string,
    @UploadedFile() file: any,
    @Query('alt') alt?: string,
    @Query('isPrimary') isPrimary?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.imagesService.uploadPropertyImage(propertyId, file, alt, isPrimary === 'true');
  }

  @Post('unit/:unitId')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload unit image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, alt: { type: 'string' }, isPrimary: { type: 'boolean' } } } })
  async uploadUnitImage(
    @Param('unitId') unitId: string,
    @UploadedFile() file: any,
    @Query('alt') alt?: string,
    @Query('isPrimary') isPrimary?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.imagesService.uploadUnitImage(unitId, file, alt, isPrimary === 'true');
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get property images' })
  async getPropertyImages(@Param('propertyId') propertyId: string) {
    return this.imagesService.getPropertyImages(propertyId);
  }

  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Get unit images' })
  async getUnitImages(@Param('unitId') unitId: string) {
    return this.imagesService.getUnitImages(unitId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update image metadata' })
  async updateImage(@Param('id') id: string, @Body() body: { alt?: string; sortOrder?: number; isPrimary?: boolean }) {
    return this.imagesService.updateImage(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete image' })
  async deleteImage(@Param('id') id: string) {
    return this.imagesService.deleteImage(id);
  }
}
