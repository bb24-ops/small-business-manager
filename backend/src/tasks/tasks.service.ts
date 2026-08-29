import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { throwPrismaConflict } from '../common/prisma-error.util.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: TaskQueryDto) {
    const where: Prisma.TaskWhereInput = {
      status: query.status,
      priority: query.priority,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { description: { contains: query.search } },
            ],
          }
        : {}),
    };
    return this.prisma.task.findMany({
      where,
      include: { employee: true },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: { employee: true } });
    if (!task) throw new NotFoundException('Zadatak nije pronađen.');
    return task;
  }

  async create(dto: CreateTaskDto) {
    this.validatePeriod(dto.startsAt, dto.dueAt);
    await this.validateActiveEmployee(dto.employeeId);
    try {
      return await this.prisma.task.create({ data: dto, include: { employee: true } });
    } catch (error) {
      throwPrismaConflict(error, 'Izabrani zaposleni nije validan.');
    }
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(id);
    this.validatePeriod(
      dto.startsAt ?? existing.startsAt.toISOString(),
      dto.dueAt ?? existing.dueAt.toISOString(),
    );
    if (dto.employeeId) await this.validateActiveEmployee(dto.employeeId);
    try {
      return await this.prisma.task.update({ where: { id }, data: dto, include: { employee: true } });
    } catch (error) {
      throwPrismaConflict(error, 'Izabrani zaposleni nije validan.');
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  private validatePeriod(startsAt: string, dueAt: string) {
    if (new Date(dueAt) <= new Date(startsAt)) {
      throw new BadRequestException('Rok mora biti nakon vremena početka zadatka.');
    }
  }

  private async validateActiveEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Izabrani zaposleni ne postoji.');
    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException('Zadatak se može dodeliti samo aktivnom zaposlenom.');
    }
  }
}
