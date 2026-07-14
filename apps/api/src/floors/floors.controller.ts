import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FloorsService } from './floors.service';
import { CreateFloorDto, UpdateFloorDto } from './dto/floors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Floors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('floors')
export class FloorsController {
  constructor(private readonly service: FloorsService) {}

  @Get() @ApiOperation({ summary: 'List floors by building' })
  findByBuilding(@Query('buildingId') buildingId: string) { return this.service.findByBuilding(buildingId); }

  @Get(':id') @ApiOperation({ summary: 'Get floor by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a floor' })
  create(@Body() dto: CreateFloorDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a floor' })
  update(@Param('id') id: string, @Body() dto: UpdateFloorDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a floor' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
