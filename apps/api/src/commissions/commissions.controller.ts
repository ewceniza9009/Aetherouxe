import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import {
  CreateCommissionDto,
  UpdateCommissionDto,
  CommissionQueryDto,
} from './dto/commissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly service: CommissionsService) {}

  @Get() @ApiOperation({ summary: 'List commission rules (paginated)' })
  findAll(@Query() query: CommissionQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get commission rule by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a commission rule' })
  create(@Body() dto: CreateCommissionDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a commission rule' })
  update(@Param('id') id: string, @Body() dto: UpdateCommissionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a commission rule' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
