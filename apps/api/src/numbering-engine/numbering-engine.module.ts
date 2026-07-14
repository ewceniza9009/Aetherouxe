import { Module } from '@nestjs/common';
import { NumberingEngineService } from './numbering-engine.service';

@Module({
  providers: [NumberingEngineService],
  exports: [NumberingEngineService],
})
export class NumberingEngineModule {}
