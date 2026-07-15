import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ArAgingService } from './ar-aging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AR Aging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ar-aging')
export class ArAgingController {
  constructor(private readonly service: ArAgingService) {}

  @Get('report') @ApiOperation({ summary: 'Generate the accounts receivable aging report' })
  report(@Query('asOfDate') asOfDate?: string, @Query('tenantId') tenantId?: string) {
    return this.service.generateArAgingReport(asOfDate, tenantId);
  }
}
