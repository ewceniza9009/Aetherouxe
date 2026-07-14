import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto, BuildingQueryDto } from './dto/buildings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Buildings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly service: BuildingsService) {}

  @Get() @ApiOperation({ summary: 'List buildings' })
  findAll(@Query() query: BuildingQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get building by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a building' })
  create(@Body() dto: CreateBuildingDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a building' })
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a building' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
