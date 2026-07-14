import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatementsService } from './statements.service';
import { CreateStatementDto, UpdateStatementDto, StatementQueryDto } from './dto/statements.dto';

@ApiTags('Statements of Account')
@Controller('statements')
export class StatementsController {
  constructor(private readonly service: StatementsService) {}

  @Get() @ApiOperation({ summary: 'List statements of account with pagination' })
  findAll(@Query() query: StatementQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get a statement of account by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a statement of account' })
  create(@Body() dto: CreateStatementDto) { return this.service.create(dto); }

  @Post('generate/:tenantId') @ApiOperation({ summary: 'Generate a statement of account for a tenant' })
  generateForTenant(
    @Param('tenantId') tenantId: string,
    @Body() body: { periodStart: string; periodEnd: string },
  ) { return this.service.generateForTenant(tenantId, body.periodStart, body.periodEnd); }

  @Patch(':id') @ApiOperation({ summary: 'Update a statement of account' })
  update(@Param('id') id: string, @Body() dto: UpdateStatementDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a statement of account' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
