import { Module } from '@nestjs/common';
import { PaymentRemindersController } from './payment-reminders.controller';
import { PaymentRemindersService } from './payment-reminders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentRemindersController],
  providers: [PaymentRemindersService],
  exports: [PaymentRemindersService],
})
export class PaymentRemindersModule {}
