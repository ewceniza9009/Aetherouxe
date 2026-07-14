import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PhasesService } from './phases.service';
import { CreatePhaseDto, UpdatePhaseDto, PhaseQueryDto } from './dto/phases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Phases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('phases')
export class PhasesController {
  constructor(private readonly service: PhasesService) {}

  @Get() @ApiOperation({ summary: 'List phases by project' })
  findByProject(@Query() query: PhaseQueryDto) { return this.service.findByProject(query.projectId); }

  @Get(':id') @ApiOperation({ summary: 'Get phase by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a phase' })
  create(@Body() dto: CreatePhaseDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a phase' })
  update(@Param('id') id: string, @Body() dto: UpdatePhaseDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a phase' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
