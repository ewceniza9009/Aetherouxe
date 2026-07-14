import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NumberingEngineModule } from '../numbering-engine/numbering-engine.module';
import { MongodbModule } from '../mongodb/mongodb.module';

@Module({
  imports: [PrismaModule, NumberingEngineModule, MongodbModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
