import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto, ConvertLeadDto } from './dto/leads.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads with pagination' })
  findAll(@Request() req: any, @Query() query: LeadQueryDto) {
    return this.service.findAll({ ...query, tenantId: req.user?.tenantId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a lead' })
  create(@Request() req: any, @Body() dto: CreateLeadDto) {
    return this.service.create({ ...dto, tenantId: dto.tenantId ?? req.user?.tenantId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to active user and initiate contract' })
  convertLead(@Param('id') id: string, @Body() dto: ConvertLeadDto) {
    return this.service.convertLead(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
