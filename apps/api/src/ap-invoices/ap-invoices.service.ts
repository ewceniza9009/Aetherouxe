import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: { disbursements: true },
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async disburse(id: string, amount: number, notes?: string) {
    const invoice = await this.prisma.apInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('AP Invoice not found');

    // 1. Create the disbursement
    const disbursement = await this.prisma.apDisbursement.create({
      data: {
        invoiceId: id,
        amount,
        notes,
      },
    });

    // 2. Update invoice status to paid
    await this.prisma.apInvoice.update({
      where: { id },
      data: { status: 'paid' },
    });

    // 3. Create Journal Entry (Debit AP, Credit Cash)
    let apAccount = await this.prisma.chartOfAccount.findUnique({
      where: { tenantId_accountCode: { tenantId: invoice.tenantId, accountCode: '2000' } }
    });
    if (!apAccount) {
      apAccount = await this.prisma.chartOfAccount.create({
        data: { tenantId: invoice.tenantId, accountCode: '2000', name: 'Accounts Payable', type: 'liability' }
      });
    }

    let cashAccount = await this.prisma.chartOfAccount.findUnique({
      where: { tenantId_accountCode: { tenantId: invoice.tenantId, accountCode: '1000' } }
    });
    if (!cashAccount) {
      cashAccount = await this.prisma.chartOfAccount.create({
        data: { tenantId: invoice.tenantId, accountCode: '1000', name: 'Operating Cash', type: 'asset' }
      });
    }

    await this.prisma.journalEntry.create({
      data: {
        tenantId: invoice.tenantId,
        reference: `DISB-${disbursement.id.substring(0, 8)}`,
        notes: `Disbursement for AP Invoice ${invoice.id}`,
        lines: {
          create: [
            { accountId: apAccount.id, debitAmount: amount, description: 'AP Disbursement' },
            { accountId: cashAccount.id, creditAmount: amount, description: 'Cash Outflow' },
          ]
        }
      }
    });

    return disbursement;
  }
}
