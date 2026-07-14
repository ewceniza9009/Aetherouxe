import { Module } from '@nestjs/common';
import { AgentTransactionsController } from './agent-transactions.controller';
import { AgentTransactionsService } from './agent-transactions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [PrismaModule, CommissionsModule],
  controllers: [AgentTransactionsController],
  providers: [AgentTransactionsService],
  exports: [AgentTransactionsService],
})
export class AgentTransactionsModule {}
