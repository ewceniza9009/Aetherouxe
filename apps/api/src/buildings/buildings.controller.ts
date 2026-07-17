import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto, BuildingQueryDto, CreateFloorDto, UpdateFloorDto } from './dto/buildings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Buildings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly service: BuildingsService) {}

  @Get() @ApiOperation({ summary: 'List buildings' })
  findAll(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Query() query: BuildingQueryDto) {
    return this.service.findAll(query, req.user.tenantId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get building by ID' })
  findOne(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post() @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create a building' })
  create(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Body() dto: CreateBuildingDto) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Update a building' })
  update(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Delete a building' })
  remove(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }

  @Get(':id/floors') @ApiOperation({ summary: 'List floors for a building' })
  findFloors(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.findFloors(id, req.user.tenantId);
  }

  @Post(':id/floors') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create a floor' })
  createFloor(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() dto: CreateFloorDto) {
    return this.service.createFloor(id, dto, req.user.tenantId);
  }

  @Patch(':id/floors/:floorId') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Update a floor' })
  updateFloor(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Param('floorId') floorId: string, @Body() dto: UpdateFloorDto) {
    return this.service.updateFloor(id, floorId, dto, req.user.tenantId);
  }

  @Delete(':id/floors/:floorId') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Delete a floor' })
  removeFloor(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Param('floorId') floorId: string) {
    return this.service.removeFloor(id, floorId, req.user.tenantId);
  }
}
