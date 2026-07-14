import { Module } from '@nestjs/common';
import { UtilityMetersController } from './utility-meters.controller';
import { UtilityMetersService } from './utility-meters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UtilityMetersController],
  providers: [UtilityMetersService],
  exports: [UtilityMetersService],
})
export class UtilityMetersModule {}
