import { Module } from '@nestjs/common';
import { GeneralLedgerController } from './general-ledger.controller';
import { GeneralLedgerService } from './general-ledger.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeneralLedgerController],
  providers: [GeneralLedgerService]
})
export class GeneralLedgerModule {}
