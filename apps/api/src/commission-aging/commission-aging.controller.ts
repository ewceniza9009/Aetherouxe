import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommissionAgingService } from './commission-aging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Commission Aging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commission-aging')
export class CommissionAgingController {
  constructor(private readonly service: CommissionAgingService) {}

  @Get('report')
  @ApiOperation({ summary: 'Generate commission aging report for unpaid commissions' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'asOfDate', required: false, description: 'ISO date (defaults to now)' })
  generateReport(@Query('tenantId') tenantId?: string, @Query('asOfDate') asOfDate?: string) {
    return this.service.generateAgingReport(tenantId, asOfDate ? new Date(asOfDate) : undefined);
  }
}
