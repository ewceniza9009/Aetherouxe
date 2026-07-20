import { Module } from '@nestjs/common';
import { CompanyOwnerService } from './company-owner.service';
import { CompanyOwnerController } from './company-owner.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyOwnerController],
  providers: [CompanyOwnerService],
  exports: [CompanyOwnerService],
})
export class CompanyOwnerModule {}
