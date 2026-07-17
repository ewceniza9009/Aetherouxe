import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { TitlesService } from './titles.service';
import {
  CreateTitleTransferDto,
  UpdateTitleTransferDto,
  TitleTransferQueryDto,
} from './dto/titles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthedRequest = ExpressRequest & {
  user: { id: string; tenantId: string };
};

@ApiTags('Title Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('title-transfers')
export class TitlesController {
  constructor(private readonly service: TitlesService) {}

  @Get()
  @ApiOperation({ summary: 'List title transfers' })
  findAll(@Request() req: AuthedRequest, @Query() query: TitleTransferQueryDto) {
    return this.service.findAll(query, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get title transfer by ID' })
  findOne(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Initiate a title transfer' })
  create(@Request() req: AuthedRequest, @Body() dto: CreateTitleTransferDto) {
    return this.service.create(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a title transfer' })
  update(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTitleTransferDto,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Complete a title transfer (marks property sold, buyer becomes owner)',
  })
  complete(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.service.complete(id, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a title transfer' })
  remove(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }
}
