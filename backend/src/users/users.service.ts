import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const userSelect = {
  id: true, email: true, role: true, isActive: true, employeeId: true,
  employee: { select: { id: true, firstName: true, lastName: true, position: true } },
  createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() { return this.prisma.user.findMany({ select: userSelect, orderBy: { email: 'asc' } }); }
  async create(dto: CreateUserDto) {
    await this.validateEmployee(dto.role, dto.employeeId);
    try {
      return await this.prisma.user.create({
        data: { email: dto.email.toLowerCase(), passwordHash: await hash(dto.password, 12), role: dto.role, employeeId: dto.employeeId },
        select: userSelect,
      });
    } catch { throw new ConflictException('Email adresa ili zaposleni su već povezani sa nalogom.'); }
  }
  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Korisnički nalog nije pronađen.');
    if (id === currentUserId && dto.isActive === false) throw new BadRequestException('Ne možete deaktivirati sopstveni nalog.');
    const role = dto.role ?? existing.role;
    const employeeId = dto.employeeId ?? existing.employeeId ?? undefined;
    await this.validateEmployee(role, employeeId);
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { email: dto.email?.toLowerCase(), role: dto.role, isActive: dto.isActive, employeeId: dto.employeeId, passwordHash: dto.password ? await hash(dto.password, 12) : undefined },
        select: userSelect,
      });
    } catch { throw new ConflictException('Email adresa ili zaposleni su već povezani sa nalogom.'); }
  }
  private async validateEmployee(role: UserRole, employeeId?: string | null) {
    if (role === UserRole.EMPLOYEE && !employeeId) throw new BadRequestException('Nalog zaposlenog mora biti povezan sa zaposlenim.');
    if (employeeId && !(await this.prisma.employee.findUnique({ where: { id: employeeId } }))) throw new BadRequestException('Izabrani zaposleni ne postoji.');
  }
}
