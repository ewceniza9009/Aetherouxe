import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from './dto/properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get() @ApiOperation({ summary: 'List properties with pagination' })
  findAll(@Query() query: PropertyQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get property by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a property' })
  create(@Body() dto: CreatePropertyDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a property' })
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Deactivate a property' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/specs') @ApiOperation({ summary: 'Get MongoDB property specs' })
  getSpecs(@Param('id') id: string) { return this.service.getSpecs(id); }

  @Put(':id/specs') @ApiOperation({ summary: 'Upsert MongoDB property specs' })
  updateSpecs(@Param('id') id: string, @Body() body: { specs?: any; metadata?: any }) { return this.service.updateSpecs(id, body); }
}
