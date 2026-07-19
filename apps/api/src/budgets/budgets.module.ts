import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { LineItemsController } from './line-items.controller';
import { BudgetsService } from './budgets.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetsController, LineItemsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
