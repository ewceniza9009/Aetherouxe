import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchemesService } from './schemes.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto/scheme.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('schemes')
export class SchemesController {
  constructor(private readonly schemesService: SchemesService) {}

  @Get()
  async findAll(@Query() query: ListQueryDto) {
    return this.schemesService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.schemesService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schemesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSchemeDto) {
    return this.schemesService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSchemeDto) {
    return this.schemesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.schemesService.remove(id);
  }
}
