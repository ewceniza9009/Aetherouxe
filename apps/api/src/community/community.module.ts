import { Module } from '@nestjs/common';
import { AmenityController, AmenityBookingController, CommunityPostController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AmenityController, AmenityBookingController, CommunityPostController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
