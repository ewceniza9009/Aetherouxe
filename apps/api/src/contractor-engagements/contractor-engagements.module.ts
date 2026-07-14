import { Module } from '@nestjs/common';
import { ContractorEngagementsController } from './contractor-engagements.controller';
import { ContractorEngagementsService } from './contractor-engagements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContractorEngagementsController],
  providers: [ContractorEngagementsService],
  exports: [ContractorEngagementsService],
})
export class ContractorEngagementsModule {}
