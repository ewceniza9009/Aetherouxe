import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CollectionCasesService } from './collection-cases.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  CreateCaseNoteDto,
  CaseQueryDto,
} from './dto/collection-cases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Collection Cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collection-cases')
export class CollectionCasesController {
  constructor(private readonly service: CollectionCasesService) {}

  @Get() @ApiOperation({ summary: 'List collection cases with pagination' })
  findAll(@Query() query: CaseQueryDto) { return this.service.findAll(query); }

  @Get('open-overdue') @ApiOperation({ summary: 'Open cases for leases with overdue payments older than 60 days' })
  openForOverdue(@Query('leaseId') leaseId?: string) { return this.service.openForOverdue(leaseId); }

  @Get(':id') @ApiOperation({ summary: 'Get a collection case by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a collection case' })
  create(@Body() dto: CreateCaseDto) { return this.service.create(dto); }

  @Post(':id/notes') @ApiOperation({ summary: 'Add a note to a collection case' })
  addNote(@Param('id') id: string, @Body() dto: CreateCaseNoteDto) { return this.service.addNote(id, dto); }

  @Get(':id/notes') @ApiOperation({ summary: 'List notes for a collection case' })
  getNotes(@Param('id') id: string) { return this.service.getNotes(id); }

  @Get(':id/activities') @ApiOperation({ summary: 'List activities for a collection case' })
  getActivities(@Param('id') id: string) { return this.service.getActivities(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a collection case' })
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a collection case' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
