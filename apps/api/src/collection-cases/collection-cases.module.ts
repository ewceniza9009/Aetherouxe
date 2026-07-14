import { Module } from '@nestjs/common';
import { CollectionCasesController } from './collection-cases.controller';
import { CollectionCasesService } from './collection-cases.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionCasesController],
  providers: [CollectionCasesService],
  exports: [CollectionCasesService],
})
export class CollectionCasesModule {}
