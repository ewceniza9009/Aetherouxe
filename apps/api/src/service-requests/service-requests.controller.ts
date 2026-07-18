import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  AssignRequestDto,
  ServiceRequestQueryDto,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
} from './dto/service-requests.dto';

@ApiTags('Service Requests')
@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Post() @ApiOperation({ summary: 'Create a service request' })
  create(@Body() dto: CreateServiceRequestDto) { return this.service.createServiceRequest(dto); }

  @Get() @ApiOperation({ summary: 'List service requests with filters and pagination' })
  findAll(@Query() query: ServiceRequestQueryDto) { return this.service.findAllServiceRequests(query); }

  @Post(':id/assign') @ApiOperation({ summary: 'Assign a service request' })
  assign(@Param('id') id: string, @Body() dto: AssignRequestDto) {
    return this.service.assignServiceRequest(id, dto);
  }

  @Post(':id/complete') @ApiOperation({ summary: 'Complete a service request' })
  complete(@Param('id') id: string, @Body() dto: { notes?: string }) {
    return this.service.completeServiceRequest(id, dto?.notes);
  }

  @Post(':id/cancel') @ApiOperation({ summary: 'Cancel a service request' })
  cancel(@Param('id') id: string) { return this.service.cancelServiceRequest(id); }

  @Get(':id') @ApiOperation({ summary: 'Get a service request by ID' })
  findOne(@Param('id') id: string) { return this.service.findOneServiceRequest(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a service request' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.service.updateServiceRequest(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a service request' })
  remove(@Param('id') id: string) { return this.service.removeServiceRequest(id); }
}

@ApiTags('Service Requests')
@Controller('maintenance-work-orders')
export class MaintenanceWorkOrderController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Post() @ApiOperation({ summary: 'Create a maintenance work order' })
  create(@Body() dto: CreateWorkOrderDto) { return this.service.createWorkOrder(dto); }

  @Get() @ApiOperation({ summary: 'List maintenance work orders (filter by requestId)' })
  findAll(@Query('requestId') requestId: string, @Query('serviceRequestId') serviceRequestId: string) { return this.service.findAllWorkOrders(requestId || serviceRequestId); }

  @Get('request/:requestId') @ApiOperation({ summary: 'List work orders for a service request' })
  getByRequest(@Param('requestId') requestId: string) {
    return this.service.getWorkOrdersByRequest(requestId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get a maintenance work order by ID' })
  findOne(@Param('id') id: string) { return this.service.findOneWorkOrder(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a maintenance work order' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.updateWorkOrder(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a maintenance work order' })
  remove(@Param('id') id: string) { return this.service.removeWorkOrder(id); }
}

@ApiTags('Service Requests')
@Controller('work-orders')
export class WorkOrderAliasController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Post() @ApiOperation({ summary: 'Create a maintenance work order (alias)' })
  createAlias(@Body() dto: CreateWorkOrderDto) { return this.service.createWorkOrder(dto); }

  @Get() @ApiOperation({ summary: 'List maintenance work orders (alias)' })
  findAllAlias(@Query('requestId') requestId: string, @Query('serviceRequestId') serviceRequestId: string) { return this.service.findAllWorkOrders(requestId || serviceRequestId); }

  @Get('request/:requestId') @ApiOperation({ summary: 'List work orders for a service request (alias)' })
  getByRequestAlias(@Param('requestId') requestId: string) {
    return this.service.getWorkOrdersByRequest(requestId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get a maintenance work order by ID (alias)' })
  findOneAlias(@Param('id') id: string) { return this.service.findOneWorkOrder(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a maintenance work order (alias)' })
  updateAlias(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.updateWorkOrder(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a maintenance work order (alias)' })
  removeAlias(@Param('id') id: string) { return this.service.removeWorkOrder(id); }
}
