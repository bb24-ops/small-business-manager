import { Injectable } from '@nestjs/common';
import { ResourceStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { synchronizeTaskStatuses } from '../tasks/task-status.util.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    await synchronizeTaskStatuses(this.prisma);
    const now = new Date();
    const [
      resources,
      totalCategories,
      categories,
      recentResources,
      totalTasks,
      taskStatusGroups,
      upcomingTasks,
      totalEmployees,
      activeEmployees,
      totalReservations,
      upcomingReservations,
      currentReservations,
      currentEmployeeTasks,
    ] = await Promise.all([
      this.prisma.resource.findMany({ select: { id: true, status: true, quantity: true } }),
      this.prisma.resourceCategory.count(),
      this.prisma.resourceCategory.findMany({
        select: {
          id: true,
          name: true,
          resources: { select: { quantity: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.resource.findMany({
        take: 5,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.task.count(),
      this.prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.task.findMany({
        where: { status: { not: TaskStatus.DONE } },
        take: 5,
        orderBy: { dueAt: 'asc' },
        include: { employee: true },
      }),
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.reservation.count(),
      this.prisma.reservation.findMany({
        where: { endsAt: { gte: now }, task: { status: { not: TaskStatus.DONE } } },
        take: 5,
        include: { resource: true, task: { include: { employee: true } } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.reservation.findMany({
        where: {
          startsAt: { lte: now },
          endsAt: { gt: now },
          task: { status: { not: TaskStatus.DONE } },
          resource: { status: { in: [ResourceStatus.AVAILABLE, ResourceStatus.IN_USE] } },
        },
        select: { resourceId: true, quantity: true },
      }),
      this.prisma.task.findMany({
        where: {
          employeeId: { not: null },
          status: { not: TaskStatus.DONE },
          startsAt: { lte: now },
          dueAt: { gt: now },
        },
        select: { employeeId: true },
      }),
    ]);

    const byStatus: Record<ResourceStatus, number> = {
      AVAILABLE: 0,
      IN_USE: 0,
      MAINTENANCE: 0,
      UNAVAILABLE: 0,
    };

    const schedulableQuantity = resources
      .filter((resource) => resource.status === ResourceStatus.AVAILABLE || resource.status === ResourceStatus.IN_USE)
      .reduce((sum, resource) => sum + resource.quantity, 0);
    byStatus.IN_USE = currentReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
    byStatus.AVAILABLE = Math.max(schedulableQuantity - byStatus.IN_USE, 0);
    byStatus.MAINTENANCE = resources
      .filter((resource) => resource.status === ResourceStatus.MAINTENANCE)
      .reduce((sum, resource) => sum + resource.quantity, 0);
    byStatus.UNAVAILABLE = resources
      .filter((resource) => resource.status === ResourceStatus.UNAVAILABLE)
      .reduce((sum, resource) => sum + resource.quantity, 0);
    const currentUsageByResource = new Map<string, number>();
    for (const reservation of currentReservations) {
      currentUsageByResource.set(
        reservation.resourceId,
        (currentUsageByResource.get(reservation.resourceId) ?? 0) + reservation.quantity,
      );
    }

    const taskByStatus: Record<TaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      OVERDUE: 0,
      DONE: 0,
    };
    for (const group of taskStatusGroups) {
      taskByStatus[group.status] = group._count._all;
    }

    return {
      totalResources: resources.reduce((sum, resource) => sum + resource.quantity, 0),
      totalCategories,
      byStatus,
      byCategory: categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: category.resources
          .reduce((sum, resource) => sum + resource.quantity, 0),
      })),
      recentResources: recentResources.map((resource) => {
        const schedulable = resource.status === ResourceStatus.AVAILABLE || resource.status === ResourceStatus.IN_USE;
        const currentQuantityInUse = schedulable ? currentUsageByResource.get(resource.id) ?? 0 : 0;
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
      }),
      totalTasks,
      taskByStatus,
      upcomingTasks,
      totalEmployees,
      activeEmployees,
      busyEmployees: new Set(currentEmployeeTasks.map((task) => task.employeeId)).size,
      availableEmployees: Math.max(
        activeEmployees - new Set(currentEmployeeTasks.map((task) => task.employeeId)).size,
        0,
      ),
      totalReservations,
      upcomingReservations,
    };
  }

  async getResourceUsage(days: number, direction: 'past' | 'future' = 'past') {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rangeStart = new Date(todayStart);
    if (direction === 'past') rangeStart.setDate(rangeStart.getDate() - days + 1);
    const rangeEnd = new Date(direction === 'past' ? now : todayStart);
    if (direction === 'future') rangeEnd.setDate(rangeEnd.getDate() + days);

    const [reservations, capacity] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
        select: { startsAt: true, endsAt: true, quantity: true },
      }),
      this.prisma.resource.aggregate({ _sum: { quantity: true } }),
    ]);

    const points = Array.from({ length: days }, (_, index) => {
      const dayStart = new Date(rangeStart);
      dayStart.setDate(dayStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const analysisEnd = direction === 'past'
        ? new Date(Math.min(dayEnd.getTime(), now.getTime()))
        : dayEnd;
      const events = reservations.flatMap((reservation) => {
        const start = Math.max(reservation.startsAt.getTime(), dayStart.getTime());
        const end = Math.min(reservation.endsAt.getTime(), analysisEnd.getTime());
        return start < end
          ? [{ at: start, change: reservation.quantity }, { at: end, change: -reservation.quantity }]
          : [];
      }).sort((left, right) => left.at - right.at || left.change - right.change);
      let current = 0;
      let peakQuantity = 0;
      for (const event of events) {
        current += event.change;
        peakQuantity = Math.max(peakQuantity, current);
      }
      const date = [dayStart.getFullYear(), String(dayStart.getMonth() + 1).padStart(2, '0'), String(dayStart.getDate()).padStart(2, '0')].join('-');
      return { date, peakQuantity };
    });

    const peak = points.reduce((best, point) => point.peakQuantity > best.peakQuantity ? point : best, points[0]);
    const averageQuantity = Math.round((points.reduce((sum, point) => sum + point.peakQuantity, 0) / points.length) * 10) / 10;
    return { days, direction, capacity: capacity._sum.quantity ?? 0, averageQuantity, peak, points };
  }
}
