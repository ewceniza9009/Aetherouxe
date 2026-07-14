import { Module } from '@nestjs/common';
import { RentalPaymentsController } from './rental-payments.controller';
import { RentalPaymentsService } from './rental-payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RtoModule } from '../rto/rto.module';

@Module({
  imports: [PrismaModule, RtoModule],
  controllers: [RentalPaymentsController],
  providers: [RentalPaymentsService],
  exports: [RentalPaymentsService],
})
export class RentalPaymentsModule {}
