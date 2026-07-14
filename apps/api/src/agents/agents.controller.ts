import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  CreateLicenseRenewalDto,
  UpdateLicenseRenewalDto,
  AgentQueryDto,
} from './dto/agents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  @Get() @ApiOperation({ summary: 'List real estate agents (paginated)' })
  findAll(@Query() query: AgentQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get agent by ID with relations' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a real estate agent' })
  create(@Body() dto: CreateAgentDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a real estate agent' })
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete an agent (fails if has transactions)' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/license-renewals') @ApiOperation({ summary: 'List license renewals for an agent' })
  getLicenseRenewals(@Param('id') id: string) { return this.service.getLicenseRenewals(id); }

  @Post(':id/license-renewals') @ApiOperation({ summary: 'Create a license renewal for an agent' })
  createLicenseRenewal(@Param('id') id: string, @Body() dto: CreateLicenseRenewalDto) {
    return this.service.createLicenseRenewal({ ...dto, agentId: id });
  }

  @Patch(':id/license-renewals/:lid') @ApiOperation({ summary: 'Update a license renewal' })
  updateLicenseRenewal(
    @Param('id') id: string,
    @Param('lid') lid: string,
    @Body() dto: UpdateLicenseRenewalDto,
  ) {
    return this.service.updateLicenseRenewal(lid, dto);
  }

  @Get(':id/performance') @ApiOperation({ summary: 'Get agent performance metrics' })
  getPerformance(@Param('id') id: string) { return this.service.getPerformance(id); }
}
