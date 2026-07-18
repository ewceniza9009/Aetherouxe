import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, tenantId: string) {
    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: createRoleDto.name } },
    });
    if (existing) {
      throw new ConflictException(`Role with name ${createRoleDto.name} already exists.`);
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });
    if (!role || role.tenantId !== tenantId) {
      throw new NotFoundException(`Role not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantId: string) {
    await this.findOne(id, tenantId); // ensure it exists and belongs to tenant

    if (updateRoleDto.name) {
      const existing = await this.prisma.role.findFirst({
        where: { tenantId, name: updateRoleDto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Role with name ${updateRoleDto.name} already exists.`);
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissions: updateRoleDto.permissions,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    // Prevent deletion if users are assigned
    const count = await this.prisma.user.count({ where: { roleId: id } });
    if (count > 0) {
      throw new ConflictException(`Cannot delete role because it is assigned to ${count} users.`);
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
