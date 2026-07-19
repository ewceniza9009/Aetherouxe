import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from '../sales/sales.service';
import { CodeSequenceService } from '../code-sequence/code-sequence.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  ConvertReservationDto,
} from './dto/reservation.dto';

const round2 = (n: number) => Math.round(n * 100) / 100;
const nnum = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
    private readonly codeSequence: CodeSequenceService,
  ) {}

  /**
   * Single source of truth for the reservation/option fee.
   * Mirrors sales.service.ts rent-to-own option fee logic so a reservation
   * and the later sale can never disagree on the number.
   */
  computeOptionFee(scheme: any, unit: any, overrideValue?: number): number {
    const value = overrideValue ?? nnum(unit.listPrice) ?? 0;
    if (value <= 0) return 0;
    const optionFeePct = nnum(scheme.optionFeePercent) || 2;
    return round2((value * optionFeePct) / 100);
  }

  async create(dto: CreateReservationDto, performedByUserId?: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { property: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (!unit.propertyId) throw new BadRequestException('Unit is not linked to a property');

    const scheme = await this.prisma.scheme.findUnique({ where: { id: dto.schemeId } });
    if (!scheme) throw new NotFoundException('Scheme template not found');
    if (!scheme.isActive) throw new BadRequestException('Scheme template is inactive');

    const active = await this.prisma.reservation.findFirst({
      where: { unitId: unit.id, status: 'reserved' },
    });
    if (active) {
      throw new BadRequestException('Unit already has an active reservation');
    }

    const holdDays = dto.holdDays ?? 30;
    const holdExpiry = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
    const optionFee = this.computeOptionFee(scheme, unit, dto.totalContractValue);

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          unitId: unit.id,
          schemeId: scheme.id,
          tenantId: unit.property!.tenantId,
          prospectName: dto.prospectName,
          prospectContact: dto.prospectContact,
          optionFeeAmount: optionFee,
          holdDays,
          holdExpiry,
          status: 'reserved',
          notes: dto.notes,
        },
      });

      // Reserve the unit (data-backed hold — not just a flag).
      await tx.unit.update({
        where: { id: unit.id },
        data: { status: 'reserved' },
      });

      // Q1 = collect now: issue an AR reservation invoice immediately.
      if (dto.collectFeeNow && optionFee > 0) {
        const userId = performedByUserId ?? unit.property!.tenantId;
        const resInvoiceNo = await this.codeSequence.next('reservation_invoice', {
          prefix: 'RES-INV',
        });
        await tx.arInvoice.create({
          data: {
            tenantId: unit.property!.tenantId,
            userId,
            invoiceType: 'reservation',
            referenceSource: `reservation:${reservation.id}`,
            invoiceNumber: resInvoiceNo,
            amount: optionFee,
            dueDate: holdExpiry,
            status: 'pending',
            issuedDate: new Date(),
            notes: `Reservation option fee for unit ${unit.unitNumber} (prospect: ${dto.prospectName})`,
          },
        });
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { holdingFeeCollected: true },
        });
      }

      // Return the fresh record (reflects holdingFeeCollected update above).
      return tx.reservation.findUnique({ where: { id: reservation.id } });
    });
  }

  async findAll(filter: { unitId?: string; status?: string; tenantId?: string }) {
    const where: any = {};
    if (filter.unitId) where.unitId = filter.unitId;
    if (filter.status) where.status = filter.status;
    if (filter.tenantId) where.tenantId = filter.tenantId;
    return this.prisma.reservation.findMany({
      where,
      include: {
        unit: { select: { id: true, unitNumber: true, listPrice: true, status: true } },
        scheme: { select: { id: true, code: true, name: true, schemeType: true } },
        lease: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        unit: {
          select: { id: true, unitNumber: true, listPrice: true, status: true, buildingId: true },
        },
        scheme: {
          select: { id: true, code: true, name: true, schemeType: true, optionFeePercent: true },
        },
        lease: { select: { id: true } },
      },
    });
    if (!r) throw new NotFoundException('Reservation not found');
    return r;
  }

  async findByUnit(unitId: string) {
    return this.prisma.reservation.findMany({
      where: { unitId },
      include: { scheme: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateReservationDto) {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reservation not found');
    if (existing.status !== 'reserved') {
      throw new BadRequestException(`Cannot modify a reservation in status ${existing.status}`);
    }

    let holdExpiry = existing.holdExpiry;
    if (dto.extendDays) {
      holdExpiry = new Date(Date.now() + dto.extendDays * 24 * 60 * 60 * 1000);
    } else if (dto.holdExpiry) {
      holdExpiry = new Date(dto.holdExpiry);
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        holdExpiry,
        holdDays: dto.extendDays ?? existing.holdDays,
        notes: dto.notes ?? existing.notes,
      },
    });
  }

  async cancel(id: string) {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reservation not found');
    if (existing.status !== 'reserved') {
      throw new BadRequestException(`Cannot cancel a reservation in status ${existing.status}`);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({ where: { id }, data: { status: 'cancelled' } });
      // Free the unit only if no other active reservation exists.
      const other = await tx.reservation.findFirst({
        where: { unitId: existing.unitId, status: 'reserved', id: { not: id } },
      });
      if (!other) {
        await tx.unit.update({ where: { id: existing.unitId }, data: { status: 'available' } });
      }
      return { id, status: 'cancelled' };
    });
  }

  /**
   * Convert a reservation into a sale/lease via the existing apply-scheme flow.
   * The reservation's computed option fee is passed through so the sale reuses
   * the exact number (no recomputation divergence).
   */
  async convert(id: string, dto: ConvertReservationDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { unit: { include: { property: true } }, scheme: true },
    });
    if (!existing) throw new NotFoundException('Reservation not found');
    if (existing.status !== 'reserved') {
      throw new BadRequestException(`Cannot convert a reservation in status ${existing.status}`);
    }
    if (!existing.unit.propertyId) {
      throw new BadRequestException('Unit is not linked to a property');
    }

    let applyResult: any;
    try {
      applyResult = await this.salesService.applyScheme(
        {
          schemeId: existing.schemeId,
          unitId: existing.unitId,
          buyerUserId: dto.buyerUserId,
          agentId: dto.agentId,
          totalContractValue: dto.totalContractValue ?? nnum(existing.unit.listPrice),
          monthlyRentAmount: dto.monthlyRentAmount,
          optionFeeAmount: nnum(existing.optionFeeAmount),
        },
        dto.performedByUserId,
      );
    } catch (e) {
      console.error(
        '[reservations.convert] applyScheme ERROR:',
        e?.message,
        e?.code,
        JSON.stringify(e?.meta),
      );
      throw e;
    }

    // Mark the unit as taken, reflecting the scheme type.
    const unitStatusByScheme: Record<string, any> = {
      rent_to_own: 'rto_active',
      standard_rental: 'occupied',
      spot_cash: 'sold',
      installment: 'sold',
      mortgage_assisted: 'sold',
    };
    const newUnitStatus = unitStatusByScheme[existing.scheme.schemeType] ?? 'occupied';

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: {
          status: 'converted',
          convertedLeaseId: applyResult.leaseId,
        },
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { status: newUnitStatus },
      });
    });

    return { reservationStatus: 'converted', unitStatus: newUnitStatus, ...applyResult };
  }

  /**
   * Expires overdue holds: flips reservation -> expired and frees the unit.
   * Safe to call on a schedule; idempotent.
   */
  async expireOverdue() {
    const now = new Date();
    const expired = await this.prisma.reservation.findMany({
      where: { status: 'reserved', holdExpiry: { lt: now } },
      select: { id: true, unitId: true },
    });
    if (expired.length === 0) return { expired: 0 };

    for (const r of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id: r.id }, data: { status: 'expired' } });
        const other = await tx.reservation.findFirst({
          where: { unitId: r.unitId, status: 'reserved' },
        });
        if (!other) {
          await tx.unit.update({ where: { id: r.unitId }, data: { status: 'available' } });
        }
      });
    }
    return { expired: expired.length };
  }
}
