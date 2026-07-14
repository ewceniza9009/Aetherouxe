import { Module } from '@nestjs/common';
import { CommissionAgingController } from './commission-aging.controller';
import { CommissionAgingService } from './commission-aging.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionAgingController],
  providers: [CommissionAgingService],
  exports: [CommissionAgingService],
})
export class CommissionAgingModule {}
