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
    ] = await Promise.all([
      this.prisma.resource.count(),
      this.prisma.resourceCategory.count(),
      this.prisma.resource.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.resourceCategory.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { resources: true } },
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
    ]);

    const byStatus: Record<ResourceStatus, number> = {
      AVAILABLE: 0,
      IN_USE: 0,
      MAINTENANCE: 0,
      UNAVAILABLE: 0,
    };

    for (const group of statusGroups) {
      byStatus[group.status] = group._count._all;
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
      totalResources,
      totalCategories,
      byStatus,
      byCategory: categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: category._count.resources,
      })),
      recentResources,
      totalTasks,
      taskByStatus,
      upcomingTasks,
      totalEmployees,
      activeEmployees,
    };
  }
}
