import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  ConvertReservationDto,
  ReservationFilterDto,
} from './dto/reservation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  @Roles('super_admin', 'admin', 'property_manager', 'agent')
  create(@Body() dto: CreateReservationDto, @Request() req: any) {
    return this.service.create(dto, req?.user?.id);
  }

  @Get()
  @Roles('super_admin', 'admin', 'property_manager', 'agent', 'finance')
  findAll(@Query() filter: ReservationFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('unit/:unitId')
  @Roles('super_admin', 'admin', 'property_manager', 'agent', 'finance')
  findByUnit(@Param('unitId', ParseUUIDPipe) unitId: string) {
    return this.service.findByUnit(unitId);
  }

  @Post('expire-overdue')
  @Roles('super_admin', 'admin')
  expireOverdue() {
    return this.service.expireOverdue();
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'property_manager', 'agent', 'finance')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin', 'property_manager', 'agent')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReservationDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/convert')
  @Roles('super_admin', 'admin', 'property_manager', 'agent')
  convert(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConvertReservationDto) {
    return this.service.convert(id, dto);
  }

  @Post(':id/cancel')
  @Roles('super_admin', 'admin', 'property_manager', 'agent')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(id);
  }
}
