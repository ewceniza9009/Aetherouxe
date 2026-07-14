import { Module } from '@nestjs/common';
import { MortgageController } from './mortgage.controller';
import { MortgageService } from './mortgage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MortgageController],
  providers: [MortgageService],
  exports: [MortgageService],
})
export class MortgageModule {}
