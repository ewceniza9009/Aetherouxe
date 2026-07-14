import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UtilityBillsService } from './utility-bills.service';
import { CreateBillDto, UpdateBillDto, BillQueryDto, GenerateBillsDto } from './dto/utility-bills.dto';

@ApiTags('Utility Bills')
@Controller('utility-bills')
export class UtilityBillsController {
  constructor(private readonly service: UtilityBillsService) {}

  @Post() @ApiOperation({ summary: 'Create a utility bill' })
  create(@Body() dto: CreateBillDto) { return this.service.create(dto); }

  @Post('generate') @ApiOperation({ summary: 'Generate bills for a period from meter readings' })
  generateForPeriod(@Body() dto: GenerateBillsDto) { return this.service.generateForPeriod(dto); }

  @Get() @ApiOperation({ summary: 'List utility bills with pagination and filters' })
  findAll(@Query() query: BillQueryDto) { return this.service.findAll(query); }

  @Get('tenant/:tenantId') @ApiOperation({ summary: 'List bills for a tenant' })
  getByTenant(@Param('tenantId') tenantId: string) { return this.service.getByTenant(tenantId); }

  @Get(':id') @ApiOperation({ summary: 'Get a utility bill by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a utility bill' })
  update(@Param('id') id: string, @Body() dto: UpdateBillDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/mark-paid') @ApiOperation({ summary: 'Mark a utility bill as paid' })
  markPaid(@Param('id') id: string) { return this.service.markPaid(id); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a utility bill' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
