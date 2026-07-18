import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationRole, NotificationType } from '@prisma/client';

export interface NotificationList {
  notifications: any[];
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private toNum(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  private async upsert(
    refId: string,
    role: NotificationRole,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      link?: string;
      tenantId?: string | null;
      userId?: string | null;
      ownerId?: string | null;
    },
  ): Promise<boolean> {
    const existing = await this.prisma.notification.findFirst({
      where: { refId, role, isRead: false },
    });
    if (existing) return false;
    await this.prisma.notification.create({
      data: { refId, role, ...data },
    });
    return true;
  }

  async sync(): Promise<{ created: number }> {
    let created = 0;
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const outstanding = ['pending', 'overdue', 'partially_paid'];

    // ── Rent overdue (admin) & rent due (resident) ──
    const payments = await this.prisma.rentalPayment.findMany({
      where: { status: { in: outstanding } },
      include: {
        leaseAgreement: {
          include: { tenant: true, property: true },
        },
      },
    });

    for (const p of payments) {
      const owed = this.toNum(p.amountDue) - this.toNum(p.amountPaid);
      if (owed <= 0) continue;
      const refId = `rp:${p.id}`;
      const tenant = p.leaseAgreement?.tenant;
      const name = tenant
        ? `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`.trim() || tenant.email
        : 'Tenant';
      const platformTenantId = p.leaseAgreement?.property?.tenantId ?? null;
      const dueStr = p.dueDate ? p.dueDate.toISOString().slice(0, 10) : '';

      if (p.dueDate && p.dueDate < now) {
        const ok = await this.upsert(refId, 'admin', {
          type: 'rent_overdue',
          title: 'Rent overdue',
          message: `Rent overdue from ${name}: ${owed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due ${dueStr}`,
          link: '/leases',
          tenantId: platformTenantId,
        });
        if (ok) created++;
      } else if (p.dueDate && p.dueDate >= now && p.dueDate <= inThreeDays) {
        const ok = await this.upsert(refId, 'resident', {
          type: 'rent_due',
          title: 'Rent due soon',
          message: `Your rent of ${owed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is due ${dueStr}`,
          link: '/',
          tenantId: platformTenantId,
          userId: p.leaseAgreement?.tenantUserId ?? null,
        });
        if (ok) created++;
      }
    }

    // ── Service requests (admin + resident) ──
    const serviceRequests = await this.prisma.serviceRequest.findMany({
      where: { status: { in: ['open', 'assigned', 'in_progress'] } },
    });
    for (const sr of serviceRequests) {
      const refId = `sr:${sr.id}`;
      const adminOk = await this.upsert(refId, 'admin', {
        type: 'service_request',
        title: 'Service request open',
        message: `Service request (${sr.category}) is ${sr.status}`,
        link: `/service-requests/${sr.id}`,
        tenantId: sr.tenantId ?? null,
      });
      if (adminOk) created++;
      const residentOk = await this.upsert(refId, 'resident', {
        type: 'service_request',
        title: 'Service request update',
        message: `Your service request is ${sr.status}`,
        link: '/service-requests',
        tenantId: sr.tenantId ?? null,
      });
      if (residentOk) created++;
    }

    // ── Document signatures pending (admin) ──
    const signatures = await this.prisma.documentSignature.findMany({
      where: { status: 'pending' },
      include: { documentVault: true },
    });
    for (const ds of signatures) {
      const refId = `ds:${ds.id}`;
      const ok = await this.upsert(refId, 'admin', {
        type: 'document_signature',
        title: 'Signature pending',
        message: `Document "${ds.documentVault?.title ?? 'document'}" awaits signature from ${ds.signerName}`,
        link: `/documents/${ds.documentVaultId}`,
      });
      if (ok) created++;
    }

    // ── Collection cases (admin) ──
    const cases = await this.prisma.collectionCase.findMany({
      where: { status: { in: ['open', 'in_progress', 'escalated'] } },
    });
    for (const cc of cases) {
      const refId = `cc:${cc.id}`;
      const ok = await this.upsert(refId, 'admin', {
        type: 'collection_case',
        title: 'Collection case active',
        message: `Collection case is ${cc.status} with ${this.toNum(cc.totalOutstanding).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding`,
        link: `/collections/cases/${cc.id}`,
        tenantId: cc.tenantId ?? null,
      });
      if (ok) created++;
    }

    return { created };
  }

  async getForRole(
    role: NotificationRole,
    userId?: string,
    tenantId?: string,
    ownerId?: string,
    limit?: number,
  ): Promise<NotificationList> {
    const where: any = { role };
    if (userId) where.userId = userId;
    if (tenantId) where.tenantId = tenantId;
    if (ownerId) where.ownerId = ownerId;

    const take = limit ? Math.min(100, Math.max(1, Math.floor(limit))) : 50;

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return { notifications, unreadCount };
  }

  async markRead(id: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(
    role: NotificationRole,
    userId?: string,
    tenantId?: string,
    ownerId?: string,
  ) {
    const where: any = { role, isRead: false };
    if (userId) where.userId = userId;
    if (tenantId) where.tenantId = tenantId;
    if (ownerId) where.ownerId = ownerId;

    const res = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    return { updated: res.count };
  }
}
