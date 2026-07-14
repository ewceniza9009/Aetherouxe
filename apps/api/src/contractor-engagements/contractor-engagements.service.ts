import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEngagementDto, UpdateEngagementDto, CreatePaymentDto } from './dto/contractor-engagements.dto';

@Injectable()
export class ContractorEngagementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEngagementDto) {
    return this.prisma.contractorEngagement.create({
      data: {
        budgetLineItemId: dto.budgetLineItemId,
        contractorId: dto.contractorId,
        contractAmount: dto.contractAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        terms: dto.terms,
      },
      include: { payments: true, budgetLineItem: true, contractor: true },
    });
  }

  async findOne(id: string) {
    const engagement = await this.prisma.contractorEngagement.findUnique({
      where: { id },
      include: { payments: true, budgetLineItem: true, contractor: true },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');
    return engagement;
  }

  async update(id: string, dto: UpdateEngagementDto) {
    await this.findOne(id);
    return this.prisma.contractorEngagement.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { payments: true, budgetLineItem: true, contractor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contractorPayment.deleteMany({ where: { contractorEngagementId: id } });
    await this.prisma.contractorEngagement.delete({ where: { id } });
    return { deleted: true };
  }

  async createPayment(engagementId: string, dto: CreatePaymentDto) {
    await this.findOne(engagementId);
    return this.prisma.contractorPayment.create({
      data: {
        contractorEngagementId: engagementId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        invoiceReference: dto.invoiceReference,
        paymentMethod: dto.paymentMethod,
        status: dto.status ?? 'pending_approval',
        notes: dto.notes,
      },
    });
  }
}
