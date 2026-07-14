import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentRemindersService } from './payment-reminders.service';
import { CreateReminderDto, UpdateReminderDto, ReminderQueryDto } from './dto/payment-reminders.dto';

@ApiTags('Payment Reminders')
@Controller('payment-reminders')
export class PaymentRemindersController {
  constructor(private readonly service: PaymentRemindersService) {}

  @Get() @ApiOperation({ summary: 'List payment reminders with pagination' })
  findAll(@Query() query: ReminderQueryDto) { return this.service.findAll(query); }

  @Get('due') @ApiOperation({ summary: 'List pending reminders due on or before now' })
  findDue(@Query('now') now?: string) { return this.service.findDue(now ? new Date(now) : undefined); }

  @Get(':id') @ApiOperation({ summary: 'Get a payment reminder by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a payment reminder' })
  create(@Body() dto: CreateReminderDto) { return this.service.create(dto); }

  @Post('generate-overdue') @ApiOperation({ summary: 'Generate post-due reminders for overdue payments' })
  generateForOverdue(
    @Body() body: { tenantId?: string; leaseId?: string },
  ) { return this.service.generateForOverdue(body?.tenantId, body?.leaseId); }

  @Patch(':id') @ApiOperation({ summary: 'Update a payment reminder' })
  update(@Param('id') id: string, @Body() dto: UpdateReminderDto) { return this.service.update(id, dto); }

  @Post(':id/mark-sent') @ApiOperation({ summary: 'Mark a payment reminder as sent' })
  markSent(@Param('id') id: string) { return this.service.markSent(id); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a payment reminder' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
