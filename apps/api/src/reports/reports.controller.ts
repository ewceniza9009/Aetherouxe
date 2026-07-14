import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RevenueTrendQueryDto } from './dto/reports.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('portfolio-kpis')
  @ApiOperation({ summary: 'Get aggregate portfolio KPIs' })
  getPortfolioKpis(@Query('tenantId') tenantId?: string) {
    return this.service.getPortfolioKpis(tenantId);
  }

  @Get('revenue-trend')
  @ApiOperation({ summary: 'Get monthly revenue trend for the last N months' })
  getRevenueTrend(@Query() query: RevenueTrendQueryDto) {
    return this.service.getRevenueTrend(query.months ?? 6);
  }
}
