import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { UserType } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admins can do everything
    if (user.userType === UserType.super_admin) {
      return true;
    }

    // We must fetch the user's role to check permissions
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub || user.id },
      include: { role: true },
    });

    if (!dbUser || !dbUser.role) {
      throw new ForbiddenException('You do not have the required role to access this resource.');
    }

    const userPermissions = dbUser.role.permissions || [];
    const hasPermission = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions to access this resource.');
    }

    return true;
  }
}
