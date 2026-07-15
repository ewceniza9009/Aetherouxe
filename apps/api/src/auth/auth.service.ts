import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
    };
  }

  async login(loginDto: LoginDto) {
    const userPayload = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateTokens(userPayload);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const tenant = await this.resolveTenant(dto.tenantId, dto.tenantDomain);
    if (!tenant) {
      throw new ConflictException('No tenant specified and no default tenant is configured.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        passwordHash,
        userType: 'tenant',
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });

    return this.generateTokens({
      id: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
    });
  }

  private async resolveTenant(tenantId?: string, tenantDomain?: string) {
    if (tenantId) {
      return this.prisma.tenant.findUnique({ where: { id: tenantId } });
    }
    if (tenantDomain) {
      return this.prisma.tenant.findUnique({ where: { domain: tenantDomain } });
    }
    const defaultDomain = process.env.DEFAULT_TENANT_DOMAIN;
    if (defaultDomain) {
      return this.prisma.tenant.findUnique({ where: { domain: defaultDomain } });
    }
    return null;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; tokenVersion: number }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
      });

      return this.generateTokens({
        id: updated.id,
        email: updated.email,
        userType: updated.userType,
        tenantId: updated.tenantId,
        tokenVersion: updated.tokenVersion,
      });
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { loggedOut: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, domain: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateMe(userId: string, data: { firstName?: string; lastName?: string; phone?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName ?? user.firstName,
        lastName: data.lastName ?? user.lastName,
        phone: data.phone ?? user.phone,
        email: data.email ?? user.email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, domain: true } },
      },
    });
    return updated;
  }

  private generateTokens(userPayload: { id: string; email: string; userType: any; tenantId: string; tokenVersion: number }) {
    const payload = {
      sub: userPayload.id,
      email: userPayload.email,
      userType: userPayload.userType,
      tenantId: userPayload.tenantId,
      tokenVersion: userPayload.tokenVersion,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
        expiresIn: '7d',
      }),
      user: userPayload,
    };
  }
}
