import { Module } from '@nestjs/common';
import { CommissionAgingController } from './commission-aging.controller';
import { CommissionAgingService } from './commission-aging.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [CommissionAgingController],
  providers: [CommissionAgingService],
  exports: [CommissionAgingService],
})
export class CommissionAgingModule {}
