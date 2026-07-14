import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UtilityMetersService } from './utility-meters.service';
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto } from './dto/utility-meters.dto';

@ApiTags('Utility Meters')
@Controller('utility-meters')
export class UtilityMetersController {
  constructor(private readonly service: UtilityMetersService) {}

  @Post() @ApiOperation({ summary: 'Create a utility meter' })
  create(@Body() dto: CreateMeterDto) { return this.service.create(dto); }

  @Get() @ApiOperation({ summary: 'List utility meters with pagination and filters' })
  findAll(@Query() query: MeterQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get a utility meter by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a utility meter' })
  update(@Param('id') id: string, @Body() dto: UpdateMeterDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a utility meter' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
