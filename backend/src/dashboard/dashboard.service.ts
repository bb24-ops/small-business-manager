import { Injectable } from '@nestjs/common';
import { ResourceStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalResources,
      totalCategories,
      statusGroups,
      categories,
      recentResources,
      totalTasks,
      taskStatusGroups,
      upcomingTasks,
      totalEmployees,
      activeEmployees,
      totalReservations,
      upcomingReservations,
    ] = await Promise.all([
      this.prisma.resource.aggregate({ _sum: { quantity: true } }),
      this.prisma.resourceCategory.count(),
      this.prisma.resource.groupBy({
        by: ['status'],
        _sum: { quantity: true },
      }),
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
        where: { endsAt: { gte: new Date() } },
        take: 5,
        include: { resource: true, task: { include: { employee: true } } },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    const byStatus: Record<ResourceStatus, number> = {
      AVAILABLE: 0,
      IN_USE: 0,
      MAINTENANCE: 0,
      UNAVAILABLE: 0,
    };

    for (const group of statusGroups) {
      byStatus[group.status] = group._sum.quantity ?? 0;
    }

    const taskByStatus: Record<TaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    for (const group of taskStatusGroups) {
      taskByStatus[group.status] = group._count._all;
    }

    return {
      totalResources: totalResources._sum.quantity ?? 0,
      totalCategories,
      byStatus,
      byCategory: categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: category.resources
          .reduce((sum, resource) => sum + resource.quantity, 0),
      })),
      recentResources,
      totalTasks,
      taskByStatus,
      upcomingTasks,
      totalEmployees,
      activeEmployees,
      totalReservations,
      upcomingReservations,
    };
  }
}
