import { Module } from '@nestjs/common';
import {
  ServiceRequestController,
  MaintenanceWorkOrderController,
  WorkOrderAliasController,
} from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApInvoicesModule } from '../ap-invoices/ap-invoices.module';

@Module({
  imports: [PrismaModule, ApInvoicesModule],
  controllers: [ServiceRequestController, MaintenanceWorkOrderController, WorkOrderAliasController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
