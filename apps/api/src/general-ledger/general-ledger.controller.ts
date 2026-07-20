import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { GeneralLedgerService, GlEntriesQuery } from './general-ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('general-ledger')
@UseGuards(JwtAuthGuard)
export class GeneralLedgerController {
  constructor(private readonly generalLedgerService: GeneralLedgerService) {}

  @Get('entries')
  findAllEntries(@Request() req: any, @Query() query: GlEntriesQuery) {
    const tenantId = req.user.tenantId;
    return this.generalLedgerService.findAllEntries(tenantId, query);
  }

  @Get('coa')
  findAllAccounts(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.generalLedgerService.findAllAccounts(tenantId);
  }
}
