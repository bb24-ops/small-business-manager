import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { employee: true },
    });
    if (!user?.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email adresa ili lozinka nisu ispravni.');
    }
    const profile = this.toProfile(user);
    return { accessToken: await this.jwt.signAsync({ ...profile, sub: user.id }), user: profile };
  }

  async me(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { employee: true } });
    if (!user?.isActive) throw new UnauthorizedException('Korisnički nalog nije aktivan.');
    return this.toProfile(user);
  }

  private toProfile(user: { id: string; email: string; role: 'ADMIN' | 'EMPLOYEE'; employeeId: string | null; employee: { firstName: string; lastName: string } | null }) {
    return { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId, employee: user.employee };
  }
}
