import { Module } from '@nestjs/common';
import { ApInvoicesController } from './ap-invoices.controller';
import { ApInvoicesService } from './ap-invoices.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApInvoicesController],
  providers: [ApInvoicesService],
  exports: [ApInvoicesService],
})
export class ApInvoicesModule {}
