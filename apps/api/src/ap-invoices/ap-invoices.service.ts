import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';
import { ApInvoiceQueryDto } from './dto/ap-invoices.dto';

@Injectable()
export class ApInvoicesService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'status', type: 'eq' },
      { field: 'sourceType', type: 'eq' },
      { field: 'vendorId', type: 'eq' },
    ],
    search: ['invoiceNumber', 'vendor.companyName', 'notes'],
    sortable: ['createdAt', 'dueDate', 'amount', 'invoiceNumber'],
  };

  async findAll(tenantId: string, query: ApInvoiceQueryDto) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    const where: any = { tenantId, ...built.where };
    return paginate(this.prisma.apInvoice, {
      page: query.page,
      limit: query.limit,
      where,
      include: { disbursements: true, vendor: true },
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.apInvoice.findUnique({
      where: { id },
      include: { disbursements: true, vendor: true },
    });
    if (!invoice) throw new NotFoundException('AP Invoice not found');
    return invoice;
  }

  /** Generate next invoice number: AP-YYYYMM-NNNN */
  private async nextInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const prefix = `AP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const key = `ap_invoice:${tenantId}:${prefix}`;

    const counter = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.sequenceCounter.findUnique({ where: { key } });
      if (existing) {
        return tx.sequenceCounter.update({
          where: { key },
          data: { value: { increment: 1 } },
        });
      }
      return tx.sequenceCounter.create({
        data: { key, value: 1, prefix },
      });
    });

    return `${prefix}-${String(counter.value).padStart(4, '0')}`;
  }

  /**
   * Create an AP invoice with duplicate guard and GL entry.
   * Called by ServiceRequestsService when a work order is completed.
   */
  async createFromWorkOrder(data: {
    tenantId: string;
    workOrderId: string;
    vendorId: string;
    amount: number;
    notes?: string;
  }) {
    // Duplicate guard: no two AP invoices for the same work order
    const existing = await this.prisma.apInvoice.findFirst({
      where: {
        tenantId: data.tenantId,
        sourceType: 'SERVICE_REQUEST',
        sourceId: data.workOrderId,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `AP Invoice ${existing.invoiceNumber ?? existing.id} already exists for this work order.`,
      );
    }

    const invoiceNumber = await this.nextInvoiceNumber(data.tenantId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.prisma.$transaction(async (tx) => {
      // Look up work order to resolve service request ID for drillable links
      const wo = await tx.maintenanceWorkOrder.findUnique({ where: { id: data.workOrderId } });
      const sourceId = wo?.serviceRequestId ?? data.workOrderId;

      // 1. Create AP Invoice
      const invoice = await tx.apInvoice.create({
        data: {
          tenantId: data.tenantId,
          sourceType: 'SERVICE_REQUEST',
          sourceId,
          vendorId: data.vendorId,
          invoiceNumber,
          amount: data.amount,
          status: 'pending_approval',
          notes: data.notes ?? `Auto-generated from completed Work Order ${data.workOrderId}`,
          dueDate,
        },
      });

      // 2. GL Entry: Debit Maintenance Expense (5100), Credit Accounts Payable (2000)
      let expenseAccount = await tx.chartOfAccount.findUnique({
        where: { tenantId_accountCode: { tenantId: data.tenantId, accountCode: '5100' } },
      });
      if (!expenseAccount) {
        expenseAccount = await tx.chartOfAccount.create({
          data: {
            tenantId: data.tenantId,
            accountCode: '5100',
            name: 'Maintenance Expense',
            type: 'expense',
          },
        });
      }

      let apAccount = await tx.chartOfAccount.findUnique({
        where: { tenantId_accountCode: { tenantId: data.tenantId, accountCode: '2000' } },
      });
      if (!apAccount) {
        apAccount = await tx.chartOfAccount.create({
          data: {
            tenantId: data.tenantId,
            accountCode: '2000',
            name: 'Accounts Payable',
            type: 'liability',
          },
        });
      }

      await tx.journalEntry.create({
        data: {
          tenantId: data.tenantId,
          reference: `AP-AP-${data.workOrderId}`,
          notes: `AP Liability recognized: ${invoiceNumber}`,
          lines: {
            create: [
              {
                accountId: expenseAccount.id,
                debitAmount: data.amount,
                description: 'Maintenance Expense',
              },
              {
                accountId: apAccount.id,
                creditAmount: data.amount,
                description: 'Accounts Payable',
              },
            ],
          },
        },
      });

      return invoice;
    });
  }

  /** Approve a pending_approval AP invoice → approved */
  async approve(id: string) {
    const invoice = await this.prisma.apInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('AP Invoice not found');
    if (invoice.status !== 'pending_approval') {
      throw new BadRequestException(`Cannot approve invoice in "${invoice.status}" status.`);
    }

    return this.prisma.apInvoice.update({
      where: { id },
      data: { status: 'approved' },
    });
  }

  /** Disburse (pay) an approved AP invoice */
  async disburse(id: string, amount: number, notes?: string) {
    const invoice = await this.prisma.apInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('AP Invoice not found');
    if (invoice.status !== 'approved') {
      throw new BadRequestException(
        `Cannot disburse invoice in "${invoice.status}" status. Must be approved first.`,
      );
    }
    if (amount > Number(invoice.amount)) {
      throw new BadRequestException(
        `Disbursement amount (${amount}) exceeds invoice amount (${invoice.amount}).`,
      );
    }

    // Total disbursed so far
    const existingDisbursed = await this.prisma.apDisbursement.aggregate({
      where: { invoiceId: id },
      _sum: { amount: true },
    });
    const totalDisbursed = Number(existingDisbursed._sum.amount ?? 0);
    if (totalDisbursed + amount > Number(invoice.amount)) {
      throw new BadRequestException(
        `Total disbursements (${totalDisbursed + amount}) would exceed invoice amount (${invoice.amount}).`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the disbursement record
      const disbursement = await tx.apDisbursement.create({
        data: {
          invoiceId: id,
          amount,
          notes,
        },
      });

      // 2. Update invoice status to paid (if fully paid)
      const newTotal = totalDisbursed + amount;
      const isFullyPaid = Math.abs(newTotal - Number(invoice.amount)) < 0.01;
      if (isFullyPaid) {
        await tx.apInvoice.update({
          where: { id },
          data: { status: 'paid' },
        });
      }

      // 3. GL Entry: Debit Accounts Payable (2000), Credit Operating Cash (1000)
      let apAccount = await tx.chartOfAccount.findUnique({
        where: { tenantId_accountCode: { tenantId: invoice.tenantId, accountCode: '2000' } },
      });
      if (!apAccount) {
        apAccount = await tx.chartOfAccount.create({
          data: {
            tenantId: invoice.tenantId,
            accountCode: '2000',
            name: 'Accounts Payable',
            type: 'liability',
          },
        });
      }

      let cashAccount = await tx.chartOfAccount.findUnique({
        where: { tenantId_accountCode: { tenantId: invoice.tenantId, accountCode: '1000' } },
      });
      if (!cashAccount) {
        cashAccount = await tx.chartOfAccount.create({
          data: {
            tenantId: invoice.tenantId,
            accountCode: '1000',
            name: 'Operating Cash',
            type: 'asset',
          },
        });
      }

      await tx.journalEntry.create({
        data: {
          tenantId: invoice.tenantId,
          reference: `DISB-WO-${invoice.invoiceNumber ?? invoice.id}`,
          notes: `Disbursement for AP Invoice ${invoice.invoiceNumber ?? invoice.id}`,
          lines: {
            create: [
              { accountId: apAccount.id, debitAmount: amount, description: 'AP Disbursement' },
              { accountId: cashAccount.id, creditAmount: amount, description: 'Cash Outflow' },
            ],
          },
        },
      });

      return disbursement;
    });
  }
}
