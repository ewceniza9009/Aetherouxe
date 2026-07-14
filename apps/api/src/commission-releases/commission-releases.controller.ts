import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommissionReleasesService } from './commission-releases.service';
import {
  CreateReleaseDto,
  UpdateReleaseDto,
  ReleaseQueryDto,
} from './dto/commission-releases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Commission Releases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commission-releases')
export class CommissionReleasesController {
  constructor(private readonly service: CommissionReleasesService) {}

  @Get() @ApiOperation({ summary: 'List commission releases (paginated)' })
  findAll(@Query() query: ReleaseQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get commission release by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a commission release' })
  create(@Body() dto: CreateReleaseDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a commission release' })
  update(@Param('id') id: string, @Body() dto: UpdateReleaseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a commission release' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get('agent/:agentId') @ApiOperation({ summary: 'List releases for an agent' })
  getByAgent(@Param('agentId') agentId: string) { return this.service.getByAgent(agentId); }
}
