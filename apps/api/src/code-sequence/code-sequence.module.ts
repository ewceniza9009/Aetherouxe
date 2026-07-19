import { Module } from '@nestjs/common';
import { CodeSequenceService } from './code-sequence.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CodeSequenceService],
  exports: [CodeSequenceService],
})
export class CodeSequenceModule {}
