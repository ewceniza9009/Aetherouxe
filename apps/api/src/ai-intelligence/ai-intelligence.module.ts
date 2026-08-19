import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiIntelligenceController } from './ai-intelligence.controller';
import { RtoCreditScoreService } from './rto-credit-score.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiIntelligenceController],
  providers: [RtoCreditScoreService],
  exports: [RtoCreditScoreService],
})
export class AiIntelligenceModule {}
