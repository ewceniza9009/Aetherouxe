import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CollectionActivitiesService } from './collection-activities.service';
import { CreateActivityDto, UpdateActivityDto, ActivityQueryDto } from './dto/collection-activities.dto';

@ApiTags('Collection Activities')
@Controller('collection-activities')
export class CollectionActivitiesController {
  constructor(private readonly service: CollectionActivitiesService) {}

  @Get() @ApiOperation({ summary: 'List collection activities with pagination' })
  findAll(@Query() query: ActivityQueryDto) { return this.service.findAll(query); }

  @Get('case/:caseId') @ApiOperation({ summary: 'List activities for a collection case' })
  getByCase(@Param('caseId') caseId: string) { return this.service.getByCase(caseId); }

  @Get(':id') @ApiOperation({ summary: 'Get a collection activity by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a collection activity' })
  create(@Body() dto: CreateActivityDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a collection activity' })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a collection activity' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
