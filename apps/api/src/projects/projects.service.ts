import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/projects.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private budgetsService: BudgetsService,
  ) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'status', type: 'enum' },
      { field: 'projectType', type: 'enum' },
    ],
    search: ['name', 'address'],
    sortable: ['createdAt', 'updatedAt', 'name', 'status', 'projectType'],
  };

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        description: dto.description,
        projectType: dto.projectType,
        status: dto.status ?? 'planning',
        totalPhases: dto.totalPhases,
        targetStartDate: dto.targetStartDate ? new Date(dto.targetStartDate) : undefined,
        targetCompletionDate: dto.targetCompletionDate ? new Date(dto.targetCompletionDate) : undefined,
        projectLogoUrl: dto.projectLogoUrl,
        address: dto.address,
      },
      include: { phases: { orderBy: { phaseOrder: 'asc' } } },
    });
  }

  async findAll(query: ProjectQueryDto) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    return paginate(this.prisma.project, {
      page: query.page,
      limit: query.limit,
      where: built.where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        phases: { orderBy: { phaseOrder: 'asc' } },
        buildings: true,
        budgets: { where: { isCurrentVersion: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        targetStartDate: dto.targetStartDate ? new Date(dto.targetStartDate) : undefined,
        targetCompletionDate: dto.targetCompletionDate ? new Date(dto.targetCompletionDate) : undefined,
      },
      include: { phases: { orderBy: { phaseOrder: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.update({ where: { id }, data: { status: 'completed' as any } });
    return { deleted: true };
  }

  async getBudgetHealth(id: string) {
    await this.findOne(id);
    const budgets = await this.prisma.budget.findMany({
      where: { projectId: id, isCurrentVersion: true },
      select: { id: true },
    });
    const healthResults = await Promise.all(
      budgets.map((b) => this.budgetsService.calculateBudgetHealth(b.id)),
    );
    const totalPlanned = healthResults.reduce((s, h) => s + h.totalPlanned, 0);
    const totalActual = healthResults.reduce((s, h) => s + h.totalActual, 0);
    const totalVariance = totalPlanned - totalActual;
    const plannedVsActual = healthResults.flatMap((h) =>
      h.items.map((i: { category: string; plannedAmount: number; actualAmount: number }) => ({ category: i.category, planned: i.plannedAmount, actual: i.actualAmount })),
    );
    const redCount = healthResults.filter((h) => h.overallHealth === 'red').length;
    const yellowCount = healthResults.filter((h) => h.overallHealth === 'yellow').length;
    const healthScore: 'green' | 'yellow' | 'red' =
      redCount > 0 ? 'red' : yellowCount > 0 ? 'yellow' : 'green';
    return {
      projectId: id,
      healthScore,
      totalPlanned,
      totalActual,
      totalVariance,
      variancePercentage: totalPlanned > 0 ? Math.round((totalVariance / totalPlanned) * 10000) / 100 : 0,
      plannedVsActual,
    };
  }

  async getTimeline(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { phases: { orderBy: { phaseOrder: 'asc' } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return {
      projectId: project.id,
      projectName: project.name,
      targetStartDate: project.targetStartDate,
      targetCompletionDate: project.targetCompletionDate,
      phases: project.phases.map((p) => ({
        id: p.id,
        phaseName: p.phaseName,
        phaseOrder: p.phaseOrder,
        status: p.status,
        targetStart: p.targetStart,
        targetEnd: p.targetEnd,
        actualStart: p.actualStart,
        actualEnd: p.actualEnd,
      })),
    };
  }
}
