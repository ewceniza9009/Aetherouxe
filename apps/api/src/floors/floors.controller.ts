import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FloorsService } from './floors.service';
import { CreateFloorDto, UpdateFloorDto } from './dto/floors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Floors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('floors')
export class FloorsController {
  constructor(private readonly service: FloorsService) {}

  @Get() @ApiOperation({ summary: 'List floors by building' })
  findByBuilding(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Query('buildingId') buildingId: string) {
    return this.service.findByBuilding(buildingId, req.user.tenantId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get floor by ID' })
  findOne(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post() @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create a floor' })
  create(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Body() dto: CreateFloorDto) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Update a floor' })
  update(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() dto: UpdateFloorDto) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Delete a floor' })
  remove(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }
}
