import { Module } from '@nestjs/common';
import { ConsumptionReadingsController } from './consumption-readings.controller';
import { ConsumptionReadingsService } from './consumption-readings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsumptionReadingsController],
  providers: [ConsumptionReadingsService],
  exports: [ConsumptionReadingsService],
})
export class ConsumptionReadingsModule {}
