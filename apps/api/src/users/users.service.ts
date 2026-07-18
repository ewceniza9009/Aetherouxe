import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/users.dto';
import { buildListQuery, FieldMap } from '../common/list-query.builder';
import { paginate } from '../common/dto/list-query.dto';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  userType: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  avatarUrl: true,
  tenant: { select: { id: true, name: true, domain: true } },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly fieldMap: FieldMap = {
    filters: [
      { field: 'userType', type: 'enum' },
      { field: 'isActive', type: 'bool' },
    ],
    search: ['email', 'firstName', 'lastName', 'phone'],
    sortable: ['createdAt', 'updatedAt', 'email', 'userType', 'isActive'],
  };

  async findAll(query: UserQueryDto, tenantId: string) {
    const built = buildListQuery(query, this.fieldMap, { createdAt: 'desc' });
    const where: any = { tenantId, ...built.where };
    return paginate(this.prisma.user, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: built.orderBy,
      allowedSortFields: this.fieldMap.sortable,
      select: USER_SELECT,
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userType: dto.userType,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    const data: any = {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      phone: dto.phone ?? user.phone,
      email: dto.email ?? user.email,
      userType: dto.userType ?? user.userType,
      isActive: dto.isActive ?? user.isActive,
    };
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.update({ where: { id }, data, select: USER_SELECT });
  }

  async remove(id: string, tenantId: string, actorId: string) {
    if (id === actorId) throw new ForbiddenException('You cannot deactivate your own account');
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }
}
