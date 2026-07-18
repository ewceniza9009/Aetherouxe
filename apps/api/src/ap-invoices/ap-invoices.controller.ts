import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApInvoicesService } from './ap-invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApInvoiceQueryDto } from './dto/ap-invoices.dto';

@Controller('ap-invoices')
@UseGuards(JwtAuthGuard)
export class ApInvoicesController {
  constructor(private readonly apInvoicesService: ApInvoicesService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: ApInvoiceQueryDto) {
    const tenantId = req.user.tenantId;
    return this.apInvoicesService.findAll(tenantId, query);
  }

  @Post(':id/disburse')
  disburse(@Param('id') id: string, @Body() body: { amount: number; notes?: string }) {
    return this.apInvoicesService.disburse(id, body.amount, body.notes);
  }
}
