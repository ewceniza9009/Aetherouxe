import { Controller, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateLineItemDto, UpdateLineItemDto } from './dto/budgets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

const BUDGET_ROLES = [UserType.super_admin, UserType.admin, UserType.finance];

@ApiTags('Budget Line Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('line-items')
export class LineItemsController {
  constructor(private readonly service: BudgetsService) {}

  @Post()
  @Roles(...BUDGET_ROLES)
  @ApiOperation({ summary: 'Create a budget line item' })
  create(@Body() dto: CreateLineItemDto & { budgetId: string }) {
    return this.service.createLineItem(dto.budgetId, dto);
  }

  @Patch(':lineItemId')
  @Roles(...BUDGET_ROLES)
  @ApiOperation({ summary: 'Update a budget line item' })
  update(@Param('lineItemId') lineItemId: string, @Body() dto: UpdateLineItemDto) {
    return this.service.updateLineItemById(lineItemId, dto);
  }

  @Delete(':lineItemId')
  @Roles(...BUDGET_ROLES)
  @ApiOperation({ summary: 'Delete a budget line item' })
  remove(@Param('lineItemId') lineItemId: string) {
    return this.service.removeLineItem(lineItemId);
  }
}
