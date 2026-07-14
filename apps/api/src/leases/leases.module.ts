import { Module } from '@nestjs/common';
import { LeasesController } from './leases.controller';
import { LeasesService } from './leases.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RtoModule } from '../rto/rto.module';

@Module({
  imports: [PrismaModule, RtoModule],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {}
