import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResourceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

const taskInclude = {
  employee: true,
  reservations: { include: { resource: { include: { category: true } } } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: TaskQueryDto) {
    const where: Prisma.TaskWhereInput = {
      status: query.status,
      priority: query.priority,
      ...(query.search ? { OR: [{ title: { contains: query.search } }, { description: { contains: query.search } }] } : {}),
    };
    return this.prisma.task.findMany({ where, include: taskInclude, orderBy: [{ status: 'asc' }, { dueAt: 'asc' }] });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (!task) throw new NotFoundException('Zadatak nije pronađen.');
    return task;
  }

  async create(dto: CreateTaskDto) {
    this.validatePeriod(dto.startsAt, dto.dueAt);
    const { resourceIds, ...taskData } = dto;
    return this.prisma.$transaction(async (tx) => {
      await this.validateActiveEmployee(tx, dto.employeeId);
      await this.validateResources(tx, resourceIds, dto.startsAt, dto.dueAt);
      return tx.task.create({
        data: {
          ...taskData,
          reservations: { create: resourceIds.map((resourceId) => ({ resourceId, startsAt: dto.startsAt, endsAt: dto.dueAt })) },
        },
        include: taskInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(id);
    const startsAt = dto.startsAt ?? existing.startsAt.toISOString();
    const dueAt = dto.dueAt ?? existing.dueAt.toISOString();
    const resourceIds = dto.resourceIds ?? existing.reservations.map((reservation) => reservation.resourceId);
    this.validatePeriod(startsAt, dueAt);
    const { resourceIds: _resourceIds, ...taskData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (dto.employeeId) await this.validateActiveEmployee(tx, dto.employeeId);
      await this.validateResources(tx, resourceIds, startsAt, dueAt, id);
      await tx.reservation.deleteMany({ where: { taskId: id, resourceId: { notIn: resourceIds } } });
      for (const resourceId of resourceIds) {
        await tx.reservation.upsert({
          where: { taskId_resourceId: { taskId: id, resourceId } },
          create: { taskId: id, resourceId, startsAt, endsAt: dueAt },
          update: { startsAt, endsAt: dueAt },
        });
      }
      return tx.task.update({ where: { id }, data: taskData, include: taskInclude });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  private validatePeriod(startsAt: string, dueAt: string) {
    if (new Date(dueAt) <= new Date(startsAt)) throw new BadRequestException('Rok mora biti nakon vremena početka zadatka.');
  }

  private async validateActiveEmployee(tx: Prisma.TransactionClient, employeeId: string) {
    const employee = await tx.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Izabrani zaposleni ne postoji.');
    if (employee.status !== 'ACTIVE') throw new BadRequestException('Zadatak se može dodeliti samo aktivnom zaposlenom.');
  }

  private async validateResources(tx: Prisma.TransactionClient, resourceIds: string[], startsAt: string, endsAt: string, excludedTaskId?: string) {
    const resources = await tx.resource.findMany({ where: { id: { in: resourceIds } } });
    if (resources.length !== resourceIds.length) throw new BadRequestException('Jedan ili više izabranih resursa ne postoje.');
    const unavailable = resources.filter((resource) => resource.status !== ResourceStatus.AVAILABLE);
    if (unavailable.length) throw new ConflictException(`Resurs „${unavailable[0].name}” trenutno nije dostupan.`);
    const conflict = await tx.reservation.findFirst({
      where: {
        resourceId: { in: resourceIds },
        taskId: excludedTaskId ? { not: excludedTaskId } : undefined,
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) },
      },
      include: { resource: true, task: true },
    });
    if (conflict) throw new ConflictException(`Resurs „${conflict.resource.name}” je već rezervisan za zadatak „${conflict.task.title}” u izabranom periodu.`);
  }
}
