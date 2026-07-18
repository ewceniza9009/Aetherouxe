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
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'status', type: 'enum' },
      { field: 'priority', type: 'enum' },
      { field: 'category', type: 'enum' },
      { field: 'tenantId', type: 'eq' },
      { field: 'propertyId', type: 'eq' },
      { field: 'unitId', type: 'eq' },
    ],
    search: ['description'],
    sortable: ['createdAt', 'updatedAt', 'requestedAt', 'priority', 'status', 'category'],
  };

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
    const built = buildListQuery(query, this.fieldMap, { requestedAt: 'desc' });
    const { data: rows, meta } = await paginate(this.prisma.serviceRequest, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
    const data = await this.attachRelations(rows);
    return { data, meta };
  }

  private async attachRelations(rows: any[]) {
    const tenantIds = [...new Set(rows.map((r) => r.tenantId).filter(Boolean))];
    const unitIds = [...new Set(rows.map((r) => r.unitId).filter(Boolean))];

    const [tenants, units] = await Promise.all([
      tenantIds.length
        ? this.prisma.tenant.findMany({ where: { id: { in: tenantIds } } })
        : Promise.resolve([]),
      unitIds.length
        ? this.prisma.unit.findMany({ where: { id: { in: unitIds } } })
        : Promise.resolve([]),
    ]);

    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    const unitMap = new Map(units.map((u) => [u.id, u]));

    return rows.map((r) => ({
      ...r,
      tenant: r.tenantId ? { id: r.tenantId, name: tenantMap.get(r.tenantId)?.name ?? null } : null,
      unit: r.unitId ? { id: r.unitId, unitNumber: unitMap.get(r.unitId)?.unitNumber ?? null } : null,
    }));
  }

  async findOneServiceRequest(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        workOrders: { 
          include: { vendor: true },
          orderBy: { createdAt: 'desc' } 
        },
      },
    });
    if (!request) throw new NotFoundException('Service request not found');
    const [withRelations] = await this.attachRelations([request]);
    return withRelations;
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
      include: { serviceRequest: true, vendor: true },
    });
  }

  async findOneWorkOrder(id: string) {
    const workOrder = await this.prisma.maintenanceWorkOrder.findUnique({
      where: { id },
      include: { serviceRequest: true, vendor: true },
    });
    if (!workOrder) throw new NotFoundException('Maintenance work order not found');
    return workOrder;
  }

  async updateWorkOrder(id: string, dto: UpdateWorkOrderDto) {
    const existing = await this.findOneWorkOrder(id);
    const updated = await this.prisma.maintenanceWorkOrder.update({
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

    if (existing.status !== 'completed' && dto.status === 'completed' && dto.actualCost) {
      if (existing.vendorId && existing.serviceRequest?.tenantId) {
        await this.prisma.apInvoice.create({
          data: {
            tenantId: existing.serviceRequest.tenantId,
            sourceType: 'WORK_ORDER',
            sourceId: existing.id,
            vendorId: existing.vendorId,
            amount: dto.actualCost,
            status: 'pending_approval',
            notes: `Auto-generated from completed Work Order ${existing.id}`,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Due in 30 days
          }
        });
      }
    }

    return updated;
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
