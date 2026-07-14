import { Module } from '@nestjs/common';
import { CollectionActivitiesController } from './collection-activities.controller';
import { CollectionActivitiesService } from './collection-activities.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionActivitiesController],
  providers: [CollectionActivitiesService],
  exports: [CollectionActivitiesService],
})
export class CollectionActivitiesModule {}
