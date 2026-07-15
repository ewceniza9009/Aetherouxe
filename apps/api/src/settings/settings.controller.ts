import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
}
