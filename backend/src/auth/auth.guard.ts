import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth-user.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<Request>() as Request & { user: AuthUser };
    const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Prijavljivanje je obavezno.');
    try {
      const payload = await this.jwt.verifyAsync<AuthUser & { sub: string }>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.isActive) throw new UnauthorizedException('Korisnički nalog nije aktivan.');
      request.user = { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Sesija je nevažeća ili je istekla.');
    }
  }
}
