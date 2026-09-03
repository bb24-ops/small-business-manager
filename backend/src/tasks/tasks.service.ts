import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResourceStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskResourceAllocationDto } from './dto/task-resource-allocation.dto.js';
import { getAutomaticTaskStatus, synchronizeTaskStatuses } from './task-status.util.js';

const taskInclude = {
  employee: true,
  reservations: { include: { resource: { include: { category: true } } } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TaskQueryDto) {
    await synchronizeTaskStatuses(this.prisma);
    const where: Prisma.TaskWhereInput = {
      status: query.status,
      priority: query.priority,
      ...(query.search ? { OR: [{ title: { contains: query.search } }, { description: { contains: query.search } }] } : {}),
    };
    return this.prisma.task.findMany({ where, include: taskInclude, orderBy: [{ status: 'asc' }, { dueAt: 'asc' }] });
  }

  async findOne(id: string) {
    await synchronizeTaskStatuses(this.prisma);
    const task = await this.prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (!task) throw new NotFoundException('Zadatak nije pronađen.');
    return task;
  }

  async create(dto: CreateTaskDto) {
    this.validatePeriod(dto.startsAt, dto.dueAt);
    const { resources, ...taskData } = dto;
    const startsAt = new Date(dto.startsAt);
    const dueAt = new Date(dto.dueAt);
    const status = dto.status === TaskStatus.DONE
      ? TaskStatus.DONE
      : getAutomaticTaskStatus(startsAt, dueAt);
    return this.prisma.$transaction(async (tx) => {
      const employee = await this.validateActiveEmployee(tx, dto.employeeId);
      if (status !== TaskStatus.DONE) {
        await this.validateEmployeeAvailability(tx, employee, dto.startsAt, dto.dueAt);
      }
      await this.validateResources(tx, resources, dto.startsAt, dto.dueAt);
      return tx.task.create({
        data: {
          ...taskData,
          status,
          completedAt: status === TaskStatus.DONE ? new Date() : null,
          reservations: { create: resources.map((allocation) => ({ resourceId: allocation.resourceId, quantity: allocation.quantity, startsAt: dto.startsAt, endsAt: dto.dueAt })) },
        },
        include: taskInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(id);
    const startsAt = dto.startsAt ?? existing.startsAt.toISOString();
    const dueAt = dto.dueAt ?? existing.dueAt.toISOString();
    const employeeId = dto.employeeId ?? existing.employeeId;
    const requestedStatus = dto.status ?? existing.status;
    const status = requestedStatus === TaskStatus.DONE
      ? TaskStatus.DONE
      : getAutomaticTaskStatus(new Date(startsAt), new Date(dueAt));
    const allocations = dto.resources ?? existing.reservations.map((reservation) => ({ resourceId: reservation.resourceId, quantity: reservation.quantity }));
    this.validatePeriod(startsAt, dueAt);
    const { resources: _resources, status: _status, ...taskData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const employee = dto.employeeId
        ? await this.validateActiveEmployee(tx, dto.employeeId)
        : existing.employee;
      if (employeeId && employee && status !== TaskStatus.DONE) {
        await this.validateEmployeeAvailability(tx, employee, startsAt, dueAt, id);
      }
      await this.validateResources(tx, allocations, startsAt, dueAt, id);
      const resourceIds = allocations.map((allocation) => allocation.resourceId);
      await tx.reservation.deleteMany({ where: { taskId: id, resourceId: { notIn: resourceIds } } });
      for (const allocation of allocations) {
        await tx.reservation.upsert({
          where: { taskId_resourceId: { taskId: id, resourceId: allocation.resourceId } },
          create: { taskId: id, resourceId: allocation.resourceId, quantity: allocation.quantity, startsAt, endsAt: dueAt },
          update: { quantity: allocation.quantity, startsAt, endsAt: dueAt },
        });
      }
      return tx.task.update({
        where: { id },
        data: {
          ...taskData,
          status,
          completedAt: status === TaskStatus.DONE
            ? existing.completedAt ?? new Date()
            : null,
        },
        include: taskInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async complete(id: string) {
    const existing = await this.findOne(id);
    if (existing.status === TaskStatus.DONE) return existing;
    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.DONE, completedAt: new Date() },
      include: taskInclude,
    });
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
    return employee;
  }

  private async validateEmployeeAvailability(
    tx: Prisma.TransactionClient,
    employee: { id: string; firstName: string; lastName: string },
    startsAt: string,
    dueAt: string,
    excludedTaskId?: string,
  ) {
    const overlappingTask = await tx.task.findFirst({
      where: {
        employeeId: employee.id,
        status: { not: TaskStatus.DONE },
        id: excludedTaskId ? { not: excludedTaskId } : undefined,
        startsAt: { lt: new Date(dueAt) },
        dueAt: { gt: new Date(startsAt) },
      },
      select: { title: true, startsAt: true, dueAt: true },
      orderBy: { startsAt: 'asc' },
    });
    if (overlappingTask) {
      throw new ConflictException(
        `${employee.firstName} ${employee.lastName} već ima aktivan zadatak „${overlappingTask.title}” u izabranom periodu.`,
      );
    }
  }

  private async validateResources(tx: Prisma.TransactionClient, allocations: TaskResourceAllocationDto[], startsAt: string, endsAt: string, excludedTaskId?: string) {
    const resourceIds = allocations.map((allocation) => allocation.resourceId);
    if (new Set(resourceIds).size !== resourceIds.length) throw new BadRequestException('Isti resurs ne može biti dodat više puta.');
    const resources = await tx.resource.findMany({ where: { id: { in: resourceIds } } });
    if (resources.length !== resourceIds.length) throw new BadRequestException('Jedan ili više izabranih resursa ne postoje.');
    const unavailable = resources.filter(
      (resource) => resource.status !== ResourceStatus.AVAILABLE && resource.status !== ResourceStatus.IN_USE,
    );
    if (unavailable.length) throw new ConflictException(`Resurs „${unavailable[0].name}” trenutno nije dostupan.`);
    const overlapping = await tx.reservation.findMany({
      where: {
        resourceId: { in: resourceIds },
        taskId: excludedTaskId ? { not: excludedTaskId } : undefined,
        task: { status: { not: TaskStatus.DONE } },
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) },
      },
      include: { task: true },
    });
    for (const allocation of allocations) {
      const resource = resources.find((item) => item.id === allocation.resourceId)!;
      const reservations = overlapping.filter((item) => item.resourceId === allocation.resourceId);
      const maximumReserved = this.getMaximumConcurrentQuantity(reservations, startsAt, endsAt);
      if (maximumReserved + allocation.quantity > resource.quantity) {
        throw new ConflictException(`Za resurs „${resource.name}” dostupno je najviše ${resource.quantity - maximumReserved} od ukupno ${resource.quantity} jedinica u izabranom periodu.`);
      }
    }
  }

  private getMaximumConcurrentQuantity(
    reservations: Array<{ startsAt: Date; endsAt: Date; quantity: number }>,
    startsAt: string,
    endsAt: string,
  ) {
    const rangeStart = new Date(startsAt).getTime();
    const rangeEnd = new Date(endsAt).getTime();
    const events = reservations.flatMap((reservation) => [
      { at: Math.max(reservation.startsAt.getTime(), rangeStart), change: reservation.quantity },
      { at: Math.min(reservation.endsAt.getTime(), rangeEnd), change: -reservation.quantity },
    ]);
    events.sort((a, b) => a.at - b.at || a.change - b.change);
    let current = 0;
    let maximum = 0;
    for (const event of events) {
      current += event.change;
      maximum = Math.max(maximum, current);
    }
    return maximum;
  }
}
