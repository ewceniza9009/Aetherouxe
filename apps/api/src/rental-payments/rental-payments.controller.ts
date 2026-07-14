import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RentalPaymentsService } from './rental-payments.service';
import { CreateRentalPaymentDto, RecordPaymentDto, RentalPaymentQueryDto } from './dto/rental-payments.dto';

@ApiTags('Rental Payments')
@Controller('rental-payments')
export class RentalPaymentsController {
  constructor(private readonly service: RentalPaymentsService) {}

  @Get() @ApiOperation({ summary: 'List rental payments with pagination' })
  findAll(@Query() query: RentalPaymentQueryDto) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get rental payment by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Get('lease/:leaseAgreementId') @ApiOperation({ summary: 'List payments for a lease' })
  findByLease(@Param('leaseAgreementId') leaseAgreementId: string) {
    return this.service.findByLease(leaseAgreementId);
  }

  @Post() @ApiOperation({ summary: 'Create a rental payment' })
  create(@Body() dto: CreateRentalPaymentDto) { return this.service.create(dto); }

  @Post(':id/record') @ApiOperation({ summary: 'Record a payment against a billing period' })
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.service.recordPayment(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a rental payment' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
