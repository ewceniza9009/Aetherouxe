import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OwnerPnlService } from './owner-pnl.service';
import {
  CreatePnlDto,
  UpdatePnlDto,
  GeneratePnlDto,
  PnlQueryDto,
} from './dto/owner-pnl.dto';

@ApiTags('Owner P&L')
@Controller('owner-pnl')
export class OwnerPnlController {
  constructor(private readonly service: OwnerPnlService) {}

  @Post() @ApiOperation({ summary: 'Create an owner P&L statement' })
  create(@Body() dto: CreatePnlDto) { return this.service.createPnl(dto); }

  @Post('generate') @ApiOperation({ summary: 'Generate an owner P&L statement from aggregations' })
  generate(@Body() dto: GeneratePnlDto) { return this.service.generatePnl(dto); }

  @Get() @ApiOperation({ summary: 'List owner P&L statements with filters and pagination' })
  findAll(@Query() query: PnlQueryDto) { return this.service.findAllPnl(query); }

  @Get('owner/:ownerId') @ApiOperation({ summary: 'List owner P&L statements for an owner' })
  getByOwner(@Param('ownerId') ownerId: string) { return this.service.getPnlByOwner(ownerId); }

  @Get(':id') @ApiOperation({ summary: 'Get an owner P&L statement by ID' })
  findOne(@Param('id') id: string) { return this.service.findOnePnl(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update an owner P&L statement' })
  update(@Param('id') id: string, @Body() dto: UpdatePnlDto) {
    return this.service.updatePnl(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete an owner P&L statement' })
  remove(@Param('id') id: string) { return this.service.removePnl(id); }
}
