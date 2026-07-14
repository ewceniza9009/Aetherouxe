import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import { CreateLeaseDto, UpdateLeaseDto, LeaseQueryDto } from './dto/leases.dto';

@ApiTags('Leases')
@Controller('leases')
export class LeasesController {
  constructor(private readonly service: LeasesService) {}

  @Get() @ApiOperation({ summary: 'List lease agreements with pagination' })
  findAll(@Query() query: LeaseQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get lease agreement by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a lease agreement' })
  create(@Body() dto: CreateLeaseDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a lease agreement' })
  update(@Param('id') id: string, @Body() dto: UpdateLeaseDto) { return this.service.update(id, dto); }

  @Post(':id/terminate') @ApiOperation({ summary: 'Terminate a lease agreement' })
  terminate(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.terminate(id, body.reason || 'Terminated by user');
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a lease agreement' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
