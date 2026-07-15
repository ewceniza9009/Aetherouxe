import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from './dto/units.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Get() @ApiOperation({ summary: 'List units with pagination' })
  findAll(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Query() query: UnitQueryDto) {
    return this.service.findAll(query, req.user.tenantId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get unit by ID' })
  findOne(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post() @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create a unit' })
  create(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Body() dto: CreateUnitDto) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Update a unit' })
  update(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Delete a unit' })
  remove(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }
}
