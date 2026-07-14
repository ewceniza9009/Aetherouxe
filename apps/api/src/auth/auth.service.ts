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

    return { id: user.id, email: user.email, userType: user.userType, tenantId: user.tenantId };
  }

  async login(loginDto: LoginDto) {
    const userPayload = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateTokens(userPayload);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const tenant = await this.prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant configured. Run seed first.');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        passwordHash,
        userType: dto.userType,
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
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      return this.generateTokens({
        id: user.id,
        email: user.email,
        userType: user.userType,
        tenantId: user.tenantId,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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

  private generateTokens(userPayload: { id: string; email: string; userType: any; tenantId: string }) {
    const payload = { sub: userPayload.id, email: userPayload.email, userType: userPayload.userType, tenantId: userPayload.tenantId };

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
