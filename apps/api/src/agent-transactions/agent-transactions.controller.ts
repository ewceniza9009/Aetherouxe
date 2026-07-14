import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentTransactionsService } from './agent-transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from './dto/agent-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Agent Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-transactions')
export class AgentTransactionsController {
  constructor(private readonly service: AgentTransactionsService) {}

  @Get() @ApiOperation({ summary: 'List agent transactions (paginated)' })
  findAll(@Query() query: TransactionQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get agent transaction by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create an agent transaction (computes commission)' })
  create(@Body() dto: CreateTransactionDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update an agent transaction' })
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/approve') @ApiOperation({ summary: 'Approve an agent transaction' })
  approve(@Param('id') id: string) { return this.service.approve(id); }

  @Delete(':id') @ApiOperation({ summary: 'Delete an agent transaction' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get('agent/:agentId') @ApiOperation({ summary: 'List transactions for an agent' })
  getByAgent(@Param('agentId') agentId: string) { return this.service.getByAgent(agentId); }
}
