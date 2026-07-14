import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/projects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get() @ApiOperation({ summary: 'List projects' })
  findAll(@Query() query: ProjectQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a project' })
  create(@Body() dto: CreateProjectDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a project' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a project (soft)' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/timeline') @ApiOperation({ summary: 'Get project timeline for Gantt chart' })
  getTimeline(@Param('id') id: string) { return this.service.getTimeline(id); }

  @Get(':id/budget-health') @ApiOperation({ summary: 'Aggregated budget health for all project budgets' })
  getBudgetHealth(@Param('id') id: string) { return this.service.getBudgetHealth(id); }
}
