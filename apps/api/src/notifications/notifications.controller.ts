import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  MarkReadDto,
  MarkAllReadDto,
  NotificationsQueryDto,
} from './dto/notifications.dto';
import { NotificationRole } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Scan live data and create notifications' })
  sync() {
    return this.service.sync();
  }

  @Get()
  @ApiOperation({ summary: 'List notifications for a role' })
  getForRole(@Query() query: NotificationsQueryDto) {
    return this.service.getForRole(
      query.role,
      query.userId,
      query.tenantId,
      query.ownerId,
      query.limit,
    );
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(@Body() dto: MarkReadDto) {
    return this.service.markRead(dto.id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all matching notifications as read' })
  markAllRead(@Body() dto: MarkAllReadDto) {
    return this.service.markAllRead(dto.role, dto.userId, dto.tenantId);
  }
}
