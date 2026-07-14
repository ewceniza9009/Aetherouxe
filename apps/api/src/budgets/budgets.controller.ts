import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto, CreateLineItemDto, UpdateLineItemDto, BudgetQueryDto } from './dto/budgets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get() @ApiOperation({ summary: 'List budgets' })
  findAll(@Query() query: BudgetQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get budget by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a budget' })
  create(@Body() dto: CreateBudgetDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update budget (creates new version)' })
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Soft delete a budget' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/health') @ApiOperation({ summary: 'Calculate budget health' })
  getHealth(@Param('id') id: string) { return this.service.calculateBudgetHealth(id); }

  @Post(':id/line-items') @ApiOperation({ summary: 'Create budget line item' })
  createLineItem(@Param('id') id: string, @Body() dto: CreateLineItemDto) { return this.service.createLineItem(id, dto); }

  @Patch(':id/line-items/:lineItemId') @ApiOperation({ summary: 'Update budget line item' })
  updateLineItem(@Param('id') id: string, @Param('lineItemId') lineItemId: string, @Body() dto: UpdateLineItemDto) {
    return this.service.updateLineItem(id, lineItemId, dto);
  }
}
