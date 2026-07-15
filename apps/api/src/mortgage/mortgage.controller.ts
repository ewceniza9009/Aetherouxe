import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MortgageService } from './mortgage.service';
import { GenerateScenarioDto, MortgageScenarioQueryDto } from './dto/mortgage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Mortgage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mortgage')
export class MortgageController {
  constructor(private readonly service: MortgageService) {}

  @Post('scenarios/generate') @ApiOperation({ summary: 'Generate a mortgage scenario with full amortization schedule' })
  generate(@Body() dto: GenerateScenarioDto) { return this.service.generateScenario(dto); }

  @Get('scenarios') @ApiOperation({ summary: 'List mortgage scenarios with pagination' })
  findAll(@Query() query: MortgageScenarioQueryDto) { return this.service.findAll(query); }

  @Get('scenarios/lease/:leaseAgreementId') @ApiOperation({ summary: 'List mortgage scenarios for a lease' })
  findByLease(@Param('leaseAgreementId') leaseAgreementId: string) {
    return this.service.findByLease(leaseAgreementId);
  }

  @Get('scenarios/:id') @ApiOperation({ summary: 'Get a mortgage scenario with full amortization schedule' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Delete('scenarios/:id') @ApiOperation({ summary: 'Delete a mortgage scenario and its schedule' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
