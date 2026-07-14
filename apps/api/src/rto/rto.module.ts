import { Module } from '@nestjs/common';
import { RtoService } from './rto.service';
import { RtoController } from './rto.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RtoController],
  providers: [RtoService],
  exports: [RtoService],
})
export class RtoModule {}
