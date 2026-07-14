import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  AssignRequestDto,
  ServiceRequestQueryDto,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
} from './dto/service-requests.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  // ─── Service Requests ──────────────────────
  async createServiceRequest(dto: CreateServiceRequestDto) {
    return this.prisma.serviceRequest.create({
      data: {
        tenantId: dto.tenantId,
        unitId: dto.unitId,
        propertyId: dto.propertyId,
        category: dto.category,
        priority: dto.priority,
        description: dto.description,
        status: 'open',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
    });
  }

  async findAllServiceRequests(query: ServiceRequestQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.unitId) where.unitId = query.unitId;

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({ where, skip, take: limit, orderBy: { requestedAt: 'desc' } }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneServiceRequest(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        workOrders: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!request) throw new NotFoundException('Service request not found');
    return request;
  }

  async updateServiceRequest(id: string, dto: UpdateServiceRequestDto) {
    await this.findOneServiceRequest(id);
    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes,
        assignedToId: dto.assignedToId,
        assignedToType: dto.assignedToType,
        priority: dto.priority,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });
  }

  async assignServiceRequest(id: string, dto: AssignRequestDto) {
    await this.findOneServiceRequest(id);
    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
        assignedToType: dto.assignedToType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: 'assigned',
      },
    });
  }

  async completeServiceRequest(id: string, notes?: string) {
    await this.findOneServiceRequest(id);
    return this.prisma.serviceRequest.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date(), resolutionNotes: notes },
    });
  }

  async cancelServiceRequest(id: string) {
    await this.findOneServiceRequest(id);
    return this.prisma.serviceRequest.update({ where: { id }, data: { status: 'cancelled' } });
  }

  async removeServiceRequest(id: string) {
    await this.findOneServiceRequest(id);
    await this.prisma.serviceRequest.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Maintenance Work Orders ───────────────
  async createWorkOrder(dto: CreateWorkOrderDto) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: dto.serviceRequestId } });
    if (!request) throw new NotFoundException('Service request not found');

    return this.prisma.maintenanceWorkOrder.create({
      data: {
        serviceRequestId: dto.serviceRequestId,
        vendorId: dto.vendorId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        estimatedCost: dto.estimatedCost,
        actualCost: dto.actualCost,
        notes: dto.notes,
        status: dto.status ?? 'scheduled',
      },
    });
  }

  async findAllWorkOrders(requestId?: string) {
    const where: any = {};
    if (requestId) where.serviceRequestId = requestId;

    return this.prisma.maintenanceWorkOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { serviceRequest: true },
    });
  }

  async findOneWorkOrder(id: string) {
    const workOrder = await this.prisma.maintenanceWorkOrder.findUnique({
      where: { id },
      include: { serviceRequest: true },
    });
    if (!workOrder) throw new NotFoundException('Maintenance work order not found');
    return workOrder;
  }

  async updateWorkOrder(id: string, dto: UpdateWorkOrderDto) {
    await this.findOneWorkOrder(id);
    return this.prisma.maintenanceWorkOrder.update({
      where: { id },
      data: {
        status: dto.status,
        vendorId: dto.vendorId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        estimatedCost: dto.estimatedCost,
        actualCost: dto.actualCost,
        notes: dto.notes,
        completedDate:
          dto.status === 'completed' ? new Date() : undefined,
      },
    });
  }

  async removeWorkOrder(id: string) {
    await this.findOneWorkOrder(id);
    await this.prisma.maintenanceWorkOrder.delete({ where: { id } });
    return { deleted: true };
  }

  async getWorkOrdersByRequest(requestId: string) {
    return this.findAllWorkOrders(requestId);
  }
}
