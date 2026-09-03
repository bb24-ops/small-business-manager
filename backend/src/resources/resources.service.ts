import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResourceStatus, TaskStatus } from '@prisma/client';
import { throwPrismaConflict } from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateResourceDto } from './dto/create-resource.dto.js';
import { ResourceQueryDto } from './dto/resource-query.dto.js';
import { UpdateResourceDto } from './dto/update-resource.dto.js';
import { synchronizeTaskStatuses } from '../tasks/task-status.util.js';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ResourceQueryDto) {
    await synchronizeTaskStatuses(this.prisma);
    const usesCalculatedStatus = query.status === ResourceStatus.AVAILABLE || query.status === ResourceStatus.IN_USE;
    const where: Prisma.ResourceWhereInput = {
      status: usesCalculatedStatus
        ? { in: [ResourceStatus.AVAILABLE, ResourceStatus.IN_USE] }
        : query.status,
      categoryId: query.categoryId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { code: { contains: query.search } },
              { location: { contains: query.search } },
            ],
          }
        : {}),
    };

    const resources = await this.prisma.resource.findMany({
      where,
      include: { category: true },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    const enrichedResources = await this.withCurrentAvailability(resources);
    return usesCalculatedStatus
      ? enrichedResources.filter((resource) => resource.currentStatus === query.status)
      : enrichedResources;
  }

  async findOne(id: string) {
    await synchronizeTaskStatuses(this.prisma);
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!resource) throw new NotFoundException('Resurs nije pronađen.');
    return (await this.withCurrentAvailability([resource]))[0];
  }

  async create(dto: CreateResourceDto) {
    this.validateManagedStatus(dto.status);
    try {
      const resource = await this.prisma.resource.create({
        data: dto,
        include: { category: true },
      });
      return (await this.withCurrentAvailability([resource]))[0];
    } catch (error) {
      throwPrismaConflict(
        error,
        'Šifra resursa već postoji ili kategorija nije validna.',
      );
    }
  }

  async update(id: string, dto: UpdateResourceDto) {
    await this.findOne(id);
    this.validateManagedStatus(dto.status);
    if (dto.quantity !== undefined) {
      const reservations = await this.prisma.reservation.findMany({
        where: { resourceId: id },
        select: { startsAt: true, endsAt: true, quantity: true },
      });
      const maxReserved = this.getMaximumConcurrentQuantity(reservations);
      if (dto.quantity < maxReserved) {
        throw new ConflictException(
          `Količina ne može biti manja od najveće već rezervisane količine (${maxReserved}).`,
        );
      }
    }
    try {
      const resource = await this.prisma.resource.update({
        where: { id },
        data: dto,
        include: { category: true },
      });
      return (await this.withCurrentAvailability([resource]))[0];
    } catch (error) {
      throwPrismaConflict(
        error,
        'Šifra resursa već postoji ili kategorija nije validna.',
      );
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.resource.delete({ where: { id } });
  }

  private getMaximumConcurrentQuantity(
    reservations: Array<{ startsAt: Date; endsAt: Date; quantity: number }>,
  ) {
    const events = reservations.flatMap((reservation) => [
      { at: reservation.startsAt.getTime(), change: reservation.quantity },
      { at: reservation.endsAt.getTime(), change: -reservation.quantity },
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

  private validateManagedStatus(status?: ResourceStatus) {
    if (status === ResourceStatus.IN_USE) {
      throw new ConflictException('Status „U upotrebi” određuje se automatski prema aktivnim rezervacijama.');
    }
  }

  private async withCurrentAvailability<T extends { id: string; status: ResourceStatus; quantity: number }>(resources: T[]) {
    if (!resources.length) return [];
    const now = new Date();
    const reservations = await this.prisma.reservation.groupBy({
      by: ['resourceId'],
      where: {
        resourceId: { in: resources.map((resource) => resource.id) },
        startsAt: { lte: now },
        endsAt: { gt: now },
        task: { status: { not: TaskStatus.DONE } },
      },
      _sum: { quantity: true },
    });
    const inUseByResource = new Map(
      reservations.map((reservation) => [reservation.resourceId, reservation._sum.quantity ?? 0]),
    );
    return resources.map((resource) => {
      const schedulable = resource.status === ResourceStatus.AVAILABLE || resource.status === ResourceStatus.IN_USE;
      const currentQuantityInUse = schedulable ? inUseByResource.get(resource.id) ?? 0 : 0;
      return {
        ...resource,
        currentQuantityInUse,
        currentQuantityAvailable: schedulable ? Math.max(resource.quantity - currentQuantityInUse, 0) : 0,
        currentStatus: !schedulable
          ? resource.status
          : currentQuantityInUse > 0
            ? ResourceStatus.IN_USE
            : ResourceStatus.AVAILABLE,
      };
    });
  }
}
