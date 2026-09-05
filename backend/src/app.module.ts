import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ResourceCategoriesModule } from './resource-categories/resource-categories.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { RolesGuard } from './auth/roles.guard.js';
import { UsersModule } from './users/users.module.js';

function validateEnvironment(config: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'BACKEND_PORT', 'FRONTEND_URL', 'JWT_SECRET']) {
    if (!config[key]) {
      throw new Error(`Nedostaje obavezna promenljiva okruženja: ${key}`);
    }
  }

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
      validate: validateEnvironment,
    }),
    PrismaModule,
    ResourceCategoriesModule,
    ResourcesModule,
    TasksModule,
    EmployeesModule,
    ReservationsModule,
    DashboardModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
