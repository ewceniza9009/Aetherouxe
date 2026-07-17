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
  ModeratePostDto,
  CreateCommentDto,
  ModerateCommentDto,
  CommentQueryDto,
  CreateReportDto,
  ResolveReportDto,
  ReportQueryDto,
} from './dto/community.dto';
import {
  ModerationStatus,
  ModerationTargetType,
  ModerationAction,
} from '@prisma/client';

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
        tenantName: dto.tenantName,
        unitLabel: dto.unitLabel,
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
      this.prisma.amenityBooking.findMany({ where, skip, take: limit, orderBy: { bookingStart: 'desc' }, include: { tenant: true, unit: true } }),
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
    if (query.moderationStatus) where.moderationStatus = query.moderationStatus;

    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              comments: true,
              reports: { where: { status: 'open' } },
            },
          },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOnePost(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: { _count: { select: { comments: true, reports: true } } },
    });
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
    await this.prisma.$transaction([
      this.prisma.postReport.deleteMany({ where: { postId: id } }),
      this.prisma.postComment.deleteMany({ where: { postId: id } }),
      this.prisma.communityPost.delete({ where: { id } }),
    ]);
    await this.logModeration(ModerationTargetType.post, id, ModerationAction.delete);
    return { deleted: true };
  }

  // ─── Post Moderation ───────────────────────
  async moderatePost(id: string, dto: ModeratePostDto) {
    const post = await this.findOnePost(id);
    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        moderationStatus: dto.moderationStatus,
        isPublished: dto.moderationStatus === ModerationStatus.published,
        moderationReason: dto.reason,
        moderatedById: dto.moderatedById,
        moderatedAt: new Date(),
      },
    });
    await this.logModeration(
      ModerationTargetType.post,
      id,
      this.statusToAction(dto.moderationStatus, post.moderationStatus),
      dto.reason,
      dto.moderatedById,
    );
    return updated;
  }

  // ─── Comments ──────────────────────────────
  async createComment(dto: CreateCommentDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: dto.postId } });
    if (!post) throw new NotFoundException('Community post not found');
    return this.prisma.postComment.create({
      data: {
        postId: dto.postId,
        body: dto.body,
        authorId: dto.authorId,
        authorName: dto.authorName,
      },
    });
  }

  async findAllComments(query: CommentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.postId) where.postId = query.postId;
    if (query.moderationStatus) where.moderationStatus = query.moderationStatus;

    const [data, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          post: { select: { id: true, title: true } },
          _count: { select: { reports: { where: { status: 'open' } } } },
        },
      }),
      this.prisma.postComment.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async moderateComment(id: string, dto: ModerateCommentDto) {
    const comment = await this.prisma.postComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    const updated = await this.prisma.postComment.update({
      where: { id },
      data: {
        moderationStatus: dto.moderationStatus,
        moderatedById: dto.moderatedById,
        moderatedAt: new Date(),
      },
    });
    await this.logModeration(
      ModerationTargetType.comment,
      id,
      this.statusToAction(dto.moderationStatus, comment.moderationStatus),
      undefined,
      dto.moderatedById,
    );
    return updated;
  }

  async removeComment(id: string) {
    const comment = await this.prisma.postComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.prisma.$transaction([
      this.prisma.postReport.deleteMany({ where: { commentId: id } }),
      this.prisma.postComment.delete({ where: { id } }),
    ]);
    await this.logModeration(ModerationTargetType.comment, id, ModerationAction.delete);
    return { deleted: true };
  }

  // ─── Reports ───────────────────────────────
  async createReport(dto: CreateReportDto) {
    if (!dto.postId && !dto.commentId) {
      throw new NotFoundException('A report must target a post or a comment');
    }
    if (dto.postId) {
      const post = await this.prisma.communityPost.findUnique({ where: { id: dto.postId } });
      if (!post) throw new NotFoundException('Community post not found');
    }
    if (dto.commentId) {
      const comment = await this.prisma.postComment.findUnique({ where: { id: dto.commentId } });
      if (!comment) throw new NotFoundException('Comment not found');
    }
    return this.prisma.postReport.create({
      data: {
        postId: dto.postId,
        commentId: dto.commentId,
        reason: dto.reason,
        details: dto.details,
        reportedById: dto.reportedById,
        reporterName: dto.reporterName,
      },
    });
  }

  async findAllReports(query: ReportQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.postReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: { select: { id: true, title: true, moderationStatus: true } },
          comment: { select: { id: true, body: true, moderationStatus: true } },
          reportedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.postReport.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async resolveReport(id: string, dto: ResolveReportDto) {
    const report = await this.prisma.postReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    const updated = await this.prisma.postReport.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
        resolvedById: dto.resolvedById,
        resolvedAt: new Date(),
      },
    });
    await this.logModeration(
      report.commentId ? ModerationTargetType.comment : ModerationTargetType.post,
      report.commentId ?? report.postId ?? id,
      dto.status === 'dismissed'
        ? ModerationAction.dismiss_report
        : ModerationAction.action_report,
      dto.resolutionNote,
      dto.resolvedById,
    );
    return updated;
  }

  // ─── Moderation Log ────────────────────────
  async findModerationLogs(limit = 50) {
    return this.prisma.moderationLog.findMany({
      take: Number(limit) || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  private statusToAction(
    next: ModerationStatus,
    prev?: ModerationStatus,
  ): ModerationAction {
    if (next === ModerationStatus.hidden) return ModerationAction.hide;
    if (next === ModerationStatus.archived) return ModerationAction.archive;
    if (prev && prev !== ModerationStatus.published) return ModerationAction.restore;
    return ModerationAction.publish;
  }

  private async logModeration(
    targetType: ModerationTargetType,
    targetId: string,
    action: ModerationAction,
    reason?: string,
    performedById?: string,
  ) {
    await this.prisma.moderationLog.create({
      data: { targetType, targetId, action, reason, performedById },
    });
  }
}
