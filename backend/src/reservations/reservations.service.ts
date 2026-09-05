import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationQueryDto } from './dto/reservation-query.dto.js';
import { synchronizeTaskStatuses } from '../tasks/task-status.util.js';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ReservationQueryDto, employeeId?: string) {
    await synchronizeTaskStatuses(this.prisma);
    if (query.from && query.to && new Date(query.to) <= new Date(query.from)) {
      throw new BadRequestException('Kraj perioda mora biti nakon početka.');
    }
    const where: Prisma.ReservationWhereInput = {
      resourceId: query.resourceId,
      task: employeeId ? { employeeId } : undefined,
      startsAt: query.to ? { lt: new Date(query.to) } : undefined,
      endsAt: query.from ? { gt: new Date(query.from) } : undefined,
    };
    return this.prisma.reservation.findMany({
      where,
      include: { resource: { include: { category: true } }, task: { include: { employee: true } } },
      orderBy: { startsAt: 'asc' },
    });
  }
}
