import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhaseDto, UpdatePhaseDto, PhaseQueryDto } from './dto/phases.dto';

@Injectable()
export class PhasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePhaseDto) {
    let phaseOrder = dto.phaseOrder;
    if (phaseOrder == null) {
      const lastPhase = await this.prisma.phase.findFirst({
        where: { projectId: dto.projectId },
        orderBy: { phaseOrder: 'desc' },
      });
      phaseOrder = lastPhase ? lastPhase.phaseOrder + 1 : 1;
    }
    return this.prisma.phase.create({
      data: {
        projectId: dto.projectId,
        phaseName: dto.phaseName,
        phaseOrder,
        status: dto.status,
        targetStart: dto.targetStart ? new Date(dto.targetStart) : undefined,
        targetEnd: dto.targetEnd ? new Date(dto.targetEnd) : undefined,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.phase.findMany({
      where: { projectId },
      orderBy: { phaseOrder: 'asc' },
      include: { budgets: { where: { isCurrentVersion: true } } },
    });
  }

  async findOne(id: string) {
    const phase = await this.prisma.phase.findUnique({
      where: { id },
      include: { budgets: { where: { isCurrentVersion: true } } },
    });
    if (!phase) throw new NotFoundException('Phase not found');
    return phase;
  }

  async update(id: string, dto: UpdatePhaseDto) {
    await this.findOne(id);
    return this.prisma.phase.update({
      where: { id },
      data: {
        ...dto,
        targetStart: dto.targetStart ? new Date(dto.targetStart) : undefined,
        targetEnd: dto.targetEnd ? new Date(dto.targetEnd) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.phase.delete({ where: { id } });
    return { deleted: true };
  }
}
