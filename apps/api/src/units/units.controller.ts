import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from './dto/units.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Get() @ApiOperation({ summary: 'List units with pagination' })
  findAll(@Query() query: UnitQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get unit by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a unit' })
  create(@Body() dto: CreateUnitDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a unit' })
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a unit' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
