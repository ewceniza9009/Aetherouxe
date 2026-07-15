import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from './dto/properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get() @ApiOperation({ summary: 'List properties with pagination' })
  findAll(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Query() query: PropertyQueryDto) {
    return this.service.findAll(query, req.user.tenantId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get property by ID' })
  findOne(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post() @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create a property' })
  create(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Body() dto: CreatePropertyDto) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Update a property' })
  update(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Deactivate a property' })
  remove(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }

  @Get(':id/specs') @ApiOperation({ summary: 'Get MongoDB property specs' })
  getSpecs(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.getSpecs(id, req.user.tenantId);
  }

  @Put(':id/specs') @ApiOperation({ summary: 'Upsert MongoDB property specs' })
  updateSpecs(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() body: { specs?: any; metadata?: any }) {
    return this.service.updateSpecs(id, body, req.user.tenantId);
  }
}
