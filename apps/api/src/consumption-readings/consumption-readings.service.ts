import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReadingDto, UpdateReadingDto, ReadingQueryDto } from './dto/consumption-readings.dto';

@Injectable()
export class ConsumptionReadingsService {
  constructor(private prisma: PrismaService) {}

  private async assertMeter(meterId: string) {
    const meter = await this.prisma.utilityMeter.findUnique({ where: { id: meterId } });
    if (!meter) throw new NotFoundException('Utility meter not found');
    return meter;
  }

  async create(dto: CreateReadingDto) {
    await this.assertMeter(dto.meterId);

    const reading = await this.prisma.consumptionReading.create({
      data: {
        meterId: dto.meterId,
        readingDate: new Date(dto.readingDate),
        value: dto.value,
        reader: dto.reader,
        note: dto.note,
      },
    });

    await this.prisma.utilityMeter.update({
      where: { id: dto.meterId },
      data: { lastReadingValue: dto.value },
    });

    return reading;
  }

  async bulkCreate(dtos: CreateReadingDto[]) {
    if (!Array.isArray(dtos) || dtos.length === 0) return { count: 0 };

    const meterIds = [...new Set(dtos.map((d) => d.meterId))];
    const meters = await this.prisma.utilityMeter.findMany({
      where: { id: { in: meterIds } },
      select: { id: true },
    });
    const validMeterIds = new Set(meters.map((m) => m.id));
    for (const id of meterIds) {
      if (!validMeterIds.has(id)) throw new NotFoundException(`Utility meter not found: ${id}`);
    }

    const result = await this.prisma.consumptionReading.createMany({
      data: dtos.map((d) => ({
        meterId: d.meterId,
        readingDate: new Date(d.readingDate),
        value: d.value,
        reader: d.reader,
        note: d.note,
      })),
    });

    for (const meterId of meterIds) {
      const latest = await this.prisma.consumptionReading.findFirst({
        where: { meterId },
        orderBy: { readingDate: 'desc' },
      });
      if (latest) {
        await this.prisma.utilityMeter.update({
          where: { id: meterId },
          data: { lastReadingValue: latest.value },
        });
      }
    }

    return { count: result.count };
  }

  async findAll(query: ReadingQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.meterId) where.meterId = query.meterId;
    if (query.fromDate || query.toDate) {
      where.readingDate = {};
      if (query.fromDate) where.readingDate.gte = new Date(query.fromDate);
      if (query.toDate) where.readingDate.lte = new Date(query.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.consumptionReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { readingDate: 'desc' },
        include: { meter: { select: { id: true, meterNumber: true, utilityType: true } } },
      }),
      this.prisma.consumptionReading.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getByMeter(meterId: string, query?: ReadingQueryDto) {
    await this.assertMeter(meterId);
    const q = query ?? {};
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { meterId };
    if (q.fromDate || q.toDate) {
      where.readingDate = {};
      if (q.fromDate) where.readingDate.gte = new Date(q.fromDate);
      if (q.toDate) where.readingDate.lte = new Date(q.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.consumptionReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { readingDate: 'desc' },
        include: { meter: { select: { id: true, meterNumber: true, utilityType: true } } },
      }),
      this.prisma.consumptionReading.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const reading = await this.prisma.consumptionReading.findUnique({
      where: { id },
      include: { meter: { select: { id: true, meterNumber: true, utilityType: true } } },
    });
    if (!reading) throw new NotFoundException('Consumption reading not found');
    return reading;
  }

  async update(id: string, dto: UpdateReadingDto) {
    await this.findOne(id);

    if (dto.meterId) await this.assertMeter(dto.meterId);

    return this.prisma.consumptionReading.update({
      where: { id },
      data: {
        meterId: dto.meterId,
        readingDate: dto.readingDate ? new Date(dto.readingDate) : undefined,
        value: dto.value,
        reader: dto.reader,
        note: dto.note,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.consumptionReading.delete({ where: { id } });
    return { deleted: true };
  }
}
