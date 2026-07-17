import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service, UploadFile } from './s3.service';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async uploadPropertyImage(propertyId: string, file: UploadFile, alt?: string, isPrimary = false) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const { key, url } = await this.s3.upload(file, `properties/${propertyId}`);

    if (isPrimary) {
      await this.prisma.propertyImage.updateMany({
        where: { propertyId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const maxSort = await this.prisma.propertyImage.aggregate({
      where: { propertyId },
      _max: { sortOrder: true },
    });

    const image = await this.prisma.propertyImage.create({
      data: {
        propertyId,
        url,
        alt: alt || file.originalname,
        isPrimary,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    this.logger.log(`Property image uploaded: ${image.id} for property ${propertyId}`);
    return image;
  }

  async uploadUnitImage(unitId: string, file: UploadFile, alt?: string, isPrimary = false) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    const { key, url } = await this.s3.upload(file, `units/${unitId}`);

    if (isPrimary) {
      await this.prisma.unitImage.updateMany({
        where: { unitId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const maxSort = await this.prisma.unitImage.aggregate({
      where: { unitId },
      _max: { sortOrder: true },
    });

    const image = await this.prisma.unitImage.create({
      data: {
        unitId,
        url,
        alt: alt || file.originalname,
        isPrimary,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    this.logger.log(`Unit image uploaded: ${image.id} for unit ${unitId}`);
    return image;
  }

  async getPropertyImages(propertyId: string) {
    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getUnitImages(unitId: string) {
    return this.prisma.unitImage.findMany({
      where: { unitId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async updateImage(id: string, data: { alt?: string; sortOrder?: number; isPrimary?: boolean }) {
    const image = await this.prisma.propertyImage.findUnique({ where: { id } })
      || await this.prisma.unitImage.findUnique({ where: { id } });

    if (!image) throw new NotFoundException('Image not found');

    if (data.isPrimary) {
      if ('propertyId' in image) {
        await this.prisma.propertyImage.updateMany({
          where: { propertyId: image.propertyId, isPrimary: true },
          data: { isPrimary: false },
        });
      } else if ('unitId' in image) {
        await this.prisma.unitImage.updateMany({
          where: { unitId: image.unitId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
    }

    if ('propertyId' in image) {
      return this.prisma.propertyImage.update({ where: { id }, data });
    }
    return this.prisma.unitImage.update({ where: { id }, data });
  }

  async deleteImage(id: string) {
    const image = await this.prisma.propertyImage.findUnique({ where: { id } })
      || await this.prisma.unitImage.findUnique({ where: { id } });

    if (!image) throw new NotFoundException('Image not found');

    if ('propertyId' in image) {
      await this.prisma.propertyImage.delete({ where: { id } });
    } else if ('unitId' in image) {
      await this.prisma.unitImage.delete({ where: { id } });
    }

    this.logger.log(`Image deleted: ${id}`);
    return { success: true };
  }
}
