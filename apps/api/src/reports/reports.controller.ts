import { Controller, Get, Query, Res } from '@nestjs/common';
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

  @Get('sales/kpis')
  @ApiOperation({ summary: 'Get sales report KPIs' })
  getSalesKpis(@Query('tenantId') tenantId?: string) {
    return this.service.getSalesKpis(tenantId);
  }

  @Get('sales/property-performance')
  @ApiOperation({ summary: 'Get paginated property performance' })
  getSalesPropertyPerformance(
    @Query() query: import('../common/dto/list-query.dto').ListQueryDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.getSalesPropertyPerformance(query, tenantId);
  }

  @Get('sales/ledger')
  @ApiOperation({ summary: 'Get paginated sales ledger' })
  getSalesLedger(
    @Query() query: import('../common/dto/list-query.dto').ListQueryDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.getSalesLedger(query, tenantId);
  }

  @Get('revenue-trend')
  @ApiOperation({ summary: 'Get monthly revenue trend for the last N months' })
  getRevenueTrend(@Query() query: RevenueTrendQueryDto) {
    return this.service.getRevenueTrend(query.months ?? 6);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export financial or portfolio report as CSV' })
  async exportCsv(@Query('type') type: 'pnl' | 'ar' | 'gl' | 'kpis', @Res() res: any) {
    const csvContent = await this.service.exportCsv(type ?? 'kpis');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type ?? 'report'}-${Date.now()}.csv`,
    );
    return res.send(csvContent);
  }
}
