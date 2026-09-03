import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { throwPrismaConflict } from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateResourceDto } from './dto/create-resource.dto.js';
import { ResourceQueryDto } from './dto/resource-query.dto.js';
import { UpdateResourceDto } from './dto/update-resource.dto.js';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ResourceQueryDto) {
    const where: Prisma.ResourceWhereInput = {
      status: query.status,
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

    return this.prisma.resource.findMany({
      where,
      include: { category: true },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!resource) throw new NotFoundException('Resurs nije pronađen.');
    return resource;
  }

  async create(dto: CreateResourceDto) {
    try {
      return await this.prisma.resource.create({
        data: dto,
        include: { category: true },
      });
    } catch (error) {
      throwPrismaConflict(
        error,
        'Šifra resursa već postoji ili kategorija nije validna.',
      );
    }
  }

  async update(id: string, dto: UpdateResourceDto) {
    await this.findOne(id);
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
      return await this.prisma.resource.update({
        where: { id },
        data: dto,
        include: { category: true },
      });
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
}
