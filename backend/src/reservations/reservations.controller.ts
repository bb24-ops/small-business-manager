import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReservationQueryDto } from './dto/reservation-query.dto.js';
import { ReservationsService } from './reservations.service.js';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}
  @Get()
  findAll(@Query() query: ReservationQueryDto) { return this.service.findAll(query); }
}
