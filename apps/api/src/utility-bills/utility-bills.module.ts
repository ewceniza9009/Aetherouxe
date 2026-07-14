import { Module } from '@nestjs/common';
import { UtilityBillsController } from './utility-bills.controller';
import { UtilityBillsService } from './utility-bills.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UtilityBillsController],
  providers: [UtilityBillsService],
  exports: [UtilityBillsService],
})
export class UtilityBillsModule {}
