import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImagesController],
  providers: [ImagesService, S3Service],
  exports: [ImagesService, S3Service],
})
export class ImagesModule {}
