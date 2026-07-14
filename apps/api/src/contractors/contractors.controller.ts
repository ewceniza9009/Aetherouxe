import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto, UpdateContractorDto, ContractorQueryDto } from './dto/contractors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contractors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly service: ContractorsService) {}

  @Get() @ApiOperation({ summary: 'List contractors' })
  findAll(@Query() query: ContractorQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get contractor by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a contractor' })
  create(@Body() dto: CreateContractorDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a contractor' })
  update(@Param('id') id: string, @Body() dto: UpdateContractorDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Soft delete a contractor' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
