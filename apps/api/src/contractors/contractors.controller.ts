import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto, UpdateContractorDto, ContractorQueryDto } from './dto/contractors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Contractors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly service: ContractorsService) {}

  @Get() @ApiOperation({ summary: 'List contractors' })
  findAll(@Query() query: ContractorQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get contractor by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles(UserType.super_admin, UserType.admin) @ApiOperation({ summary: 'Create a contractor' })
  create(@Body() dto: CreateContractorDto) { return this.service.create(dto); }

  @Patch(':id') @Roles(UserType.super_admin, UserType.admin) @ApiOperation({ summary: 'Update a contractor' })
  update(@Param('id') id: string, @Body() dto: UpdateContractorDto) { return this.service.update(id, dto); }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin) @ApiOperation({ summary: 'Soft delete a contractor' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
