import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RtoService } from './rto.service';
import { RtoQueryDto, ExerciseOptionDto } from './dto/rto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('RTO')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rto-contracts')
export class RtoController {
  constructor(private readonly service: RtoService) {}

  @Get()
  @ApiOperation({ summary: 'List RTO contracts with filters and pagination' })
  findAll(@Query() query: RtoQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get the equity ledger for an RTO contract' })
  getLedger(@Param('id') id: string) {
    return this.service.getEquityLedger(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an RTO contract by ID with full detail' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/check-default')
  @ApiOperation({ summary: 'Manually trigger the default status check for a contract' })
  checkDefault(@Param('id') id: string) {
    return this.service.checkDefaultStatus(id);
  }

  @Post(':id/exercise')
  @ApiOperation({ summary: 'Exercise the purchase option for an RTO contract' })
  exercise(@Param('id') id: string, @Body() dto: ExerciseOptionDto) {
    return this.service.exerciseOption(id, dto.userId);
  }
}
