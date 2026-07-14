import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArAgingService } from './ar-aging.service';

@ApiTags('AR Aging')
@Controller('ar-aging')
export class ArAgingController {
  constructor(private readonly service: ArAgingService) {}

  @Get('report') @ApiOperation({ summary: 'Generate the accounts receivable aging report' })
  report(@Query('asOfDate') asOfDate?: string, @Query('tenantId') tenantId?: string) {
    return this.service.generateArAgingReport(asOfDate, tenantId);
  }
}
