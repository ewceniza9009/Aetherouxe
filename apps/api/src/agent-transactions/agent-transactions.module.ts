import { Module } from '@nestjs/common';
import { AgentTransactionsController } from './agent-transactions.controller';
import { AgentTransactionsService } from './agent-transactions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ApInvoicesModule } from '../ap-invoices/ap-invoices.module';
import { CodeSequenceModule } from '../code-sequence/code-sequence.module';

@Module({
  imports: [PrismaModule, CommissionsModule, LedgerModule, ApInvoicesModule, CodeSequenceModule],
  controllers: [AgentTransactionsController],
  providers: [AgentTransactionsService],
  exports: [AgentTransactionsService],
})
export class AgentTransactionsModule {}
