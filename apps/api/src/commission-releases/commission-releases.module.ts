import { Module } from '@nestjs/common';
import { CommissionReleasesController } from './commission-releases.controller';
import { CommissionReleasesService } from './commission-releases.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionReleasesController],
  providers: [CommissionReleasesService],
  exports: [CommissionReleasesService],
})
export class CommissionReleasesModule {}
