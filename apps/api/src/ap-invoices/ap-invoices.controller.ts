import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApInvoicesService } from './ap-invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ap-invoices')
@UseGuards(JwtAuthGuard)
export class ApInvoicesController {
  constructor(private readonly apInvoicesService: ApInvoicesService) {}

  @Get()
  findAll(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.apInvoicesService.findAll(tenantId);
  }

  @Post(':id/disburse')
  disburse(@Param('id') id: string, @Body() body: { amount: number; notes?: string }) {
    return this.apInvoicesService.disburse(id, body.amount, body.notes);
  }
}
