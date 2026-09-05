import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { ReservationQueryDto } from './dto/reservation-query.dto.js';
import { ReservationsService } from './reservations.service.js';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}
  @Get()
  findAll(@Query() query: ReservationQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.findAll(query, user.role === UserRole.EMPLOYEE ? user.employeeId ?? undefined : undefined);
  }
}
