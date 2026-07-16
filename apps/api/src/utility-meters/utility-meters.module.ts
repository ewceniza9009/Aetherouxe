import { Module } from '@nestjs/common';
import { UtilityMetersController } from './utility-meters.controller';
import { UtilityMetersService } from './utility-meters.service';
import { ConsumptionReadingsModule } from '../consumption-readings/consumption-readings.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConsumptionReadingsModule],
  controllers: [UtilityMetersController],
  providers: [UtilityMetersService],
  exports: [UtilityMetersService],
})
export class UtilityMetersModule {}
