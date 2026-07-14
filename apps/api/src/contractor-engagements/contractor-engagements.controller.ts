import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractorEngagementsService } from './contractor-engagements.service';
import { CreateEngagementDto, UpdateEngagementDto, CreatePaymentDto } from './dto/contractor-engagements.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contractor Engagements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contractor-engagements')
export class ContractorEngagementsController {
  constructor(private readonly service: ContractorEngagementsService) {}

  @Get(':id') @ApiOperation({ summary: 'Get engagement by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create a contractor engagement' })
  create(@Body() dto: CreateEngagementDto) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update a contractor engagement' })
  update(@Param('id') id: string, @Body() dto: UpdateEngagementDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete a contractor engagement' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post(':id/payments') @ApiOperation({ summary: 'Create a contractor payment' })
  createPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) { return this.service.createPayment(id, dto); }
}
