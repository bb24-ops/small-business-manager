import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { throwPrismaConflict } from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { EmployeeQueryDto } from './dto/employee-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: EmployeeQueryDto) {
    const where: Prisma.EmployeeWhereInput = {
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { email: { contains: query.search } },
              { position: { contains: query.search } },
            ],
          }
        : {}),
    };
    return this.prisma.employee.findMany({
      where,
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ status: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!employee) throw new NotFoundException('Zaposleni nije pronađen.');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    try {
      return await this.prisma.employee.create({ data: dto });
    } catch (error) {
      throwPrismaConflict(error, 'Zaposleni sa ovom email adresom već postoji.');
    }
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    try {
      return await this.prisma.employee.update({ where: { id }, data: dto });
    } catch (error) {
      throwPrismaConflict(error, 'Zaposleni sa ovom email adresom već postoji.');
    }
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    if (employee._count.tasks > 0) {
      throw new ConflictException('Zaposleni se ne može obrisati dok ima dodeljene zadatke.');
    }
    return this.prisma.employee.delete({ where: { id } });
  }
}
