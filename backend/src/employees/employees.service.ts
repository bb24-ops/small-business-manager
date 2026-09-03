import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { throwPrismaConflict } from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { EmployeeQueryDto } from './dto/employee-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { synchronizeTaskStatuses } from '../tasks/task-status.util.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: EmployeeQueryDto) {
    await synchronizeTaskStatuses(this.prisma);
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
    const employees = await this.prisma.employee.findMany({
      where,
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ status: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    });
    return this.withCurrentAvailability(employees);
  }

  async findOne(id: string) {
    await synchronizeTaskStatuses(this.prisma);
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!employee) throw new NotFoundException('Zaposleni nije pronađen.');
    return (await this.withCurrentAvailability([employee]))[0];
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

  private async withCurrentAvailability<T extends { id: string; status: string }>(employees: T[]) {
    if (!employees.length) return [];
    const now = new Date();
    const currentTasks = await this.prisma.task.findMany({
      where: {
        employeeId: { in: employees.map((employee) => employee.id) },
        status: { not: TaskStatus.DONE },
        startsAt: { lte: now },
        dueAt: { gt: now },
      },
      select: { id: true, title: true, employeeId: true, dueAt: true },
      orderBy: { startsAt: 'asc' },
    });
    return employees.map((employee) => ({
      ...employee,
      isCurrentlyBusy: currentTasks.some((task) => task.employeeId === employee.id),
      currentTask: currentTasks.find((task) => task.employeeId === employee.id) ?? null,
    }));
  }
}
