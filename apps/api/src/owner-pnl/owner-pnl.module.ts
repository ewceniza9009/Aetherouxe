import { Module } from '@nestjs/common';
import { OwnerPnlController } from './owner-pnl.controller';
import { OwnerPnlService } from './owner-pnl.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerPnlController],
  providers: [OwnerPnlService],
  exports: [OwnerPnlService],
})
export class OwnerPnlModule {}
