import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConsumptionReadingsService } from './consumption-readings.service';
import { CreateReadingDto, UpdateReadingDto, ReadingQueryDto } from './dto/consumption-readings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Consumption Readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consumption-readings')
export class ConsumptionReadingsController {
  constructor(private readonly service: ConsumptionReadingsService) {}

  @Post() @ApiOperation({ summary: 'Create a consumption reading' })
  create(@Body() dto: CreateReadingDto) { return this.service.create(dto); }

  @Post('bulk') @ApiOperation({ summary: 'Bulk create consumption readings (import)' })
  bulkCreate(@Body() dtos: CreateReadingDto[]) { return this.service.bulkCreate(dtos); }

  @Get() @ApiOperation({ summary: 'List consumption readings with pagination and filters' })
  findAll(@Query() query: ReadingQueryDto) { return this.service.findAll(query); }

  @Get('meter/:meterId') @ApiOperation({ summary: 'List readings for a meter' })
  getByMeter(@Param('meterId') meterId: string, @Query() query: ReadingQueryDto) {
    return this.service.getByMeter(meterId, query);
  }

  @Get(':id') @ApiOperation({ summary: 'Get a consumption reading by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a consumption reading' })
  update(@Param('id') id: string, @Body() dto: UpdateReadingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a consumption reading' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
