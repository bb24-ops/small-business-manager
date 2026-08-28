import { Injectable } from '@nestjs/common';
import { ResourceStatus } from '@prisma/client';
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
    };
  }
}
