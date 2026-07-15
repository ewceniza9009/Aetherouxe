import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto, CreateLineItemDto, UpdateLineItemDto, BudgetQueryDto } from './dto/budgets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

const BUDGET_ROLES = [UserType.super_admin, UserType.admin, UserType.finance];

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get() @ApiOperation({ summary: 'List budgets' })
  findAll(@Query() query: BudgetQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get budget by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles(...BUDGET_ROLES) @ApiOperation({ summary: 'Create a budget' })
  create(@Body() dto: CreateBudgetDto) { return this.service.create(dto); }

  @Patch(':id') @Roles(...BUDGET_ROLES) @ApiOperation({ summary: 'Update budget (creates new version)' })
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) { return this.service.update(id, dto); }

  @Delete(':id') @Roles(...BUDGET_ROLES) @ApiOperation({ summary: 'Soft delete a budget' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/health') @ApiOperation({ summary: 'Calculate budget health' })
  getHealth(@Param('id') id: string) { return this.service.calculateBudgetHealth(id); }

  @Post(':id/line-items') @Roles(...BUDGET_ROLES) @ApiOperation({ summary: 'Create budget line item' })
  createLineItem(@Param('id') id: string, @Body() dto: CreateLineItemDto) { return this.service.createLineItem(id, dto); }

  @Patch(':id/line-items/:lineItemId') @Roles(...BUDGET_ROLES) @ApiOperation({ summary: 'Update budget line item' })
  updateLineItem(@Param('id') id: string, @Param('lineItemId') lineItemId: string, @Body() dto: UpdateLineItemDto) {
    return this.service.updateLineItem(id, lineItemId, dto);
  }
}
