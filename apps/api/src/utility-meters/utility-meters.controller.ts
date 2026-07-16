import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UtilityMetersService } from './utility-meters.service';
import { ConsumptionReadingsService } from '../consumption-readings/consumption-readings.service';
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto } from './dto/utility-meters.dto';
import { ReadingQueryDto } from '../consumption-readings/dto/consumption-readings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Utility Meters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('utility-meters')
export class UtilityMetersController {
  constructor(
    private readonly service: UtilityMetersService,
    private readonly readingsService: ConsumptionReadingsService,
  ) {}

  @Post() @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create a utility meter' })
  create(@Body() dto: CreateMeterDto) { return this.service.create(dto); }

  @Get() @ApiOperation({ summary: 'List utility meters with pagination and filters' })
  findAll(@Query() query: MeterQueryDto) { return this.service.findAll(query); }

  @Get(':id/readings') @ApiOperation({ summary: 'List consumption readings for a meter' })
  findReadings(@Param('id') id: string, @Query() query: ReadingQueryDto) {
    return this.readingsService.getByMeter(id, query);
  }

  @Get(':id') @ApiOperation({ summary: 'Get a utility meter by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a utility meter' })
  update(@Param('id') id: string, @Body() dto: UpdateMeterDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Delete a utility meter' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
