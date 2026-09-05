import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { DashboardService } from './dashboard.service.js';
import { ResourceUsageQueryDto } from './dto/resource-usage-query.dto.js';

@ApiTags('dashboard')
@Roles(UserRole.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('resource-usage')
  getResourceUsage(@Query() query: ResourceUsageQueryDto) {
    return this.service.getResourceUsage(query.days);
  }
}
