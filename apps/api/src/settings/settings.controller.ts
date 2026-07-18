import { Controller, Get, Patch, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('company')
  @ApiOperation({ summary: 'Get company / tenant application settings' })
  getCompany(@Request() req: ExpressRequest & { user: { tenantId: string } }) {
    return this.service.getSettings(req.user.tenantId);
  }

  @Patch('company')
  @Roles(UserType.super_admin, UserType.admin)
  @ApiOperation({ summary: 'Update company / tenant application settings' })
  updateCompany(
    @Request() req: ExpressRequest & { user: { tenantId: string } },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.service.updateSettings(req.user.tenantId, dto);
  }

  @Post('company/logo')
  @Roles(UserType.super_admin, UserType.admin)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload company logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  uploadLogo(
    @Request() req: ExpressRequest & { user: { tenantId: string } },
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.service.uploadLogo(req.user.tenantId, file);
  }
}
