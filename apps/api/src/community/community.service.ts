import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAmenityDto,
  UpdateAmenityDto,
  AmenityQueryDto,
  CreateBookingDto,
  UpdateBookingDto,
  BookingQueryDto,
  CreatePostDto,
  UpdatePostDto,
  PostQueryDto,
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // ─── Amenities ─────────────────────────────
  async createAmenity(dto: CreateAmenityDto) {
    return this.prisma.amenity.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        capacity: dto.capacity,
        location: dto.location,
        hourlyRate: dto.hourlyRate,
        isActive: dto.isActive ?? true,
        propertyId: dto.propertyId,
      },
    });
  }

  async findAllAmenities(query: AmenityQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [data, total] = await Promise.all([
      this.prisma.amenity.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.amenity.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneAmenity(id: string) {
    const amenity = await this.prisma.amenity.findUnique({
      where: { id },
      include: { bookings: true, property: true },
    });
    if (!amenity) throw new NotFoundException('Amenity not found');
    return amenity;
  }

  async updateAmenity(id: string, dto: UpdateAmenityDto) {
    await this.findOneAmenity(id);
    return this.prisma.amenity.update({ where: { id }, data: { ...dto } });
  }

  async removeAmenity(id: string) {
    await this.findOneAmenity(id);
    await this.prisma.amenity.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Bookings ──────────────────────────────
  async createBooking(dto: CreateBookingDto) {
    const amenity = await this.prisma.amenity.findUnique({ where: { id: dto.amenityId } });
    if (!amenity) throw new NotFoundException('Amenity not found');

    return this.prisma.amenityBooking.create({
      data: {
        amenityId: dto.amenityId,
        tenantId: dto.tenantId,
        unitId: dto.unitId,
        bookingStart: new Date(dto.bookingStart),
        bookingEnd: new Date(dto.bookingEnd),
        totalAmount: dto.totalAmount,
        notes: dto.notes,
      },
    });
  }

  async findAllBookings(query: BookingQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.amenityId) where.amenityId = query.amenityId;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.status) where.status = query.status;
    if (query.fromDate || query.toDate) {
      where.bookingStart = {};
      if (query.fromDate) where.bookingStart.gte = new Date(query.fromDate);
      if (query.toDate) where.bookingStart.lte = new Date(query.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.amenityBooking.findMany({ where, skip, take: limit, orderBy: { bookingStart: 'desc' } }),
      this.prisma.amenityBooking.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneBooking(id: string) {
    const booking = await this.prisma.amenityBooking.findUnique({
      where: { id },
      include: { amenity: true, tenant: true },
    });
    if (!booking) throw new NotFoundException('Amenity booking not found');
    return booking;
  }

  async updateBooking(id: string, dto: UpdateBookingDto) {
    await this.findOneBooking(id);
    return this.prisma.amenityBooking.update({
      where: { id },
      data: {
        status: dto.status,
        bookingStart: dto.bookingStart ? new Date(dto.bookingStart) : undefined,
        bookingEnd: dto.bookingEnd ? new Date(dto.bookingEnd) : undefined,
        totalAmount: dto.totalAmount,
        notes: dto.notes,
      },
    });
  }

  async removeBooking(id: string) {
    await this.findOneBooking(id);
    await this.prisma.amenityBooking.delete({ where: { id } });
    return { deleted: true };
  }

  async getBookingsByTenant(tenantId: string) {
    return this.prisma.amenityBooking.findMany({
      where: { tenantId },
      orderBy: { bookingStart: 'desc' },
      include: { amenity: true },
    });
  }

  // ─── Posts ─────────────────────────────────
  async createPost(dto: CreatePostDto) {
    return this.prisma.communityPost.create({
      data: {
        title: dto.title,
        body: dto.body,
        postType: dto.postType ?? 'announcement',
        audience: dto.audience ?? 'all',
        propertyId: dto.propertyId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        authorId: dto.authorId,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  async findAllPosts(query: PostQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.postType) where.postType = query.postType;
    if (query.audience) where.audience = query.audience;

    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.communityPost.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOnePost(id: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Community post not found');
    return post;
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    await this.findOnePost(id);
    return this.prisma.communityPost.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        postType: dto.postType,
        audience: dto.audience,
        propertyId: dto.propertyId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        authorId: dto.authorId,
        isPublished: dto.isPublished,
      },
    });
  }

  async removePost(id: string) {
    await this.findOnePost(id);
    await this.prisma.communityPost.delete({ where: { id } });
    return { deleted: true };
  }
}
