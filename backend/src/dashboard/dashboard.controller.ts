import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@Roles(UserRole.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
