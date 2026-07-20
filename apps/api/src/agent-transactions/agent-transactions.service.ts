import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionsService } from '../commissions/commissions.service';
import { LedgerService } from '../ledger/ledger.service';
import { ApInvoicesService } from '../ap-invoices/ap-invoices.service';
import { CodeSequenceService } from '../code-sequence/code-sequence.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from './dto/agent-transactions.dto';

@Injectable()
export class AgentTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionsService: CommissionsService,
    private readonly ledger: LedgerService,
    private readonly apInvoicesService: ApInvoicesService,
    private readonly codeSequence: CodeSequenceService,
  ) {}

  async create(dto: CreateTransactionDto) {
    const agent = await this.prisma.realEstateAgent.findUnique({ where: { id: dto.agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    if (dto.leaseAgreementId) {
      const lease = await this.prisma.leaseAgreement.findUnique({
        where: { id: dto.leaseAgreementId },
      });
      if (!lease) throw new NotFoundException('Lease agreement not found');
    }

    let commissionValue: number | undefined;
    let rule: any = null;
    if (dto.commissionRuleId) {
      const commissionRule = await this.prisma.agentCommission.findUnique({
        where: { id: dto.commissionRuleId },
      });
      if (!commissionRule) throw new NotFoundException('Commission rule not found');
      rule = commissionRule;
      const leaseMonthlyRent =
        dto.transactionType === 'rental_lease' && dto.leaseAgreementId
          ? Number(
              (
                await this.prisma.leaseAgreement.findUnique({
                  where: { id: dto.leaseAgreementId },
                })
              )?.monthlyRentAmount || 0,
            )
          : undefined;
      commissionValue = this.commissionsService.calculateCommissionForRule(
        rule,
        dto.transactionAmount,
        leaseMonthlyRent,
      );
    }

    const calculatedCommission = commissionValue ?? 0;
    const finalCommission = calculatedCommission;

    return this.prisma.agentTransaction.create({
      data: {
        agentId: dto.agentId,
        transactionType: dto.transactionType as any,
        propertyId: dto.propertyId,
        leaseAgreementId: dto.leaseAgreementId,
        transactionAmount: dto.transactionAmount,
        commissionRuleId: dto.commissionRuleId,
        calculatedCommission,
        finalCommission,
        status: 'pending',
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
      },
      include: { agent: { include: { user: true } }, property: true, commissionRule: true },
    });
  }

  async findAll(query: TransactionQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.agentId) where.agentId = query.agentId;
    if (query.transactionType) where.transactionType = query.transactionType;
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;

    const [rows, total] = await Promise.all([
      this.prisma.agentTransaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          agent: { include: { user: true } },
          property: true,
          commissionRule: true,
          commissionReleases: true,
        },
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.agentTransaction.count({ where }),
    ]);

    const data = rows.map((r) => this.serializeTransaction(r));
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  serializeTransaction(t: any) {
    const owed = Number(t.finalCommission ?? t.calculatedCommission ?? 0);
    const bal = Array.isArray(t.commissionReleases)
      ? this.ledger.commissionBalance(t, ['cancelled'])
      : undefined;
    return {
      ...t,
      type: t.transactionType,
      amount: t.transactionAmount,
      commissionAmount: t.calculatedCommission,
      owedCommission: owed,
      ...(bal ? { paidCommission: bal.paid, remainingCommission: bal.remaining } : {}),
      propertyName: t.property?.name ?? t.property?.propertyCode ?? null,
      agentName: t.agent?.user
        ? [t.agent.user.firstName, t.agent.user.lastName].filter(Boolean).join(' ') ||
          t.agent.user.email
        : null,
    };
  }

  async findOne(id: string) {
    const tx = await this.prisma.agentTransaction.findUnique({
      where: { id },
      include: {
        agent: { include: { user: true } },
        property: true,
        leaseAgreement: true,
        commissionRule: true,
        commissionReleases: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return this.serializeTransaction(tx);
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findOne(id);
    const tx = await this.prisma.agentTransaction.update({
      where: { id },
      data: {
        status: dto.status as any,
        finalCommission: dto.finalCommission,
      },
      include: { agent: { include: { user: true } }, property: true, commissionRule: true },
    });
    return this.serializeTransaction(tx);
  }

  async approve(id: string) {
    await this.findOne(id);
    const tx = await this.prisma.agentTransaction.update({
      where: { id },
      data: { status: 'approved' },
      include: { agent: { include: { user: true } }, property: true, commissionRule: true },
    });

    // ── Elite Workflow: Create AP Accrual when commission is approved ──
    if (tx.finalCommission && Number(tx.finalCommission) > 0) {
      await this.createCommissionApAccrual(tx);
    }

    return this.serializeTransaction(tx);
  }

  /**
   * Creates an AP Invoice (accrual) for the approved commission.
   * The agent is linked as a vendor (Contractor) for AP purposes.
   */
  private async createCommissionApAccrual(tx: any) {
    const agent = await this.prisma.realEstateAgent.findUnique({
      where: { id: tx.agentId },
      include: { user: true },
    });
    if (!agent) return;

    // Ensure agent exists as a Contractor (vendor) for AP
    let contractor = await this.prisma.contractor.findFirst({
      where: { tenantId: tx.agent?.user?.tenantId || tx.property?.tenantId, userId: agent.userId },
    });
    if (!contractor) {
      contractor = await this.prisma.contractor.create({
        data: {
          tenantId: tx.agent?.user?.tenantId || tx.property?.tenantId,
          userId: agent.userId,
          companyName:
            `${agent.user?.firstName || ''} ${agent.user?.lastName || ''}`.trim() ||
            agent.user?.email ||
            'Agent',
          contactPerson: `${agent.user?.firstName || ''} ${agent.user?.lastName || ''}`.trim(),
          email: agent.user?.email,
          phone: agent.user?.phone,
          isAgent: true,
        },
      });
    }

    // Create AP Invoice (accrual) for the commission
    const apInvoiceNumber = await this.codeSequence.next('ap_invoice', {
      prefix: 'AP-COMM',
      suffix: String(new Date().getFullYear()),
    });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30

    await this.prisma.apInvoice.create({
      data: {
        tenantId: tx.agent?.user?.tenantId || tx.property?.tenantId,
        sourceType: 'COMMISSION',
        sourceId: tx.id,
        vendorId: contractor.id,
        invoiceNumber: apInvoiceNumber,
        amount: tx.finalCommission,
        dueDate,
        status: 'pending_approval', // Will be approved when commission is paid
        notes: `Commission accrual for ${tx.transactionType} on property ${tx.property?.propertyCode || tx.propertyId}. Agent: ${contractor.companyName}`,
      },
    });

    // GL Entry: Debit Commission Expense, Credit AP
    const mapping = await this.prisma.financialMapping.findFirst({
      where: {
        tenantId: tx.agent?.user?.tenantId || tx.property?.tenantId,
        transactionType: 'COMMISSION_ACCRUAL',
      },
    });
    if (mapping && mapping.debitAccountId && mapping.creditAccountId) {
      const amount = Number(tx.finalCommission);
      await this.prisma.journalEntry.create({
        data: {
          tenantId: tx.agent?.user?.tenantId || tx.property?.tenantId,
          reference: `COMM-ACC-${tx.id.substring(0, 8)}`,
          notes: `Commission accrual for agent ${contractor.companyName}`,
          lines: {
            create: [
              {
                accountId: mapping.debitAccountId,
                debitAmount: amount,
                description: 'Commission Expense',
              },
              {
                accountId: mapping.creditAccountId,
                creditAmount: amount,
                description: 'Commission Payable (AP)',
              },
            ],
          },
        },
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agentTransaction.delete({ where: { id } });
    return { deleted: true };
  }

  async getByAgent(agentId: string) {
    const rows = await this.prisma.agentTransaction.findMany({
      where: { agentId },
      include: { property: true, commissionRule: true, commissionReleases: true },
      orderBy: { transactionDate: 'desc' },
    });
    return rows.map((r) => this.serializeTransaction(r));
  }
}
