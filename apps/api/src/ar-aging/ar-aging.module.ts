import { Module } from '@nestjs/common';
import { ArAgingController } from './ar-aging.controller';
import { ArAgingService } from './ar-aging.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArAgingController],
  providers: [ArAgingService],
  exports: [ArAgingService],
})
export class ArAgingModule {}
