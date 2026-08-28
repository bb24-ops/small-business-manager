import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ResourceCategoriesModule } from './resource-categories/resource-categories.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

function validateEnvironment(config: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'BACKEND_PORT', 'FRONTEND_URL']) {
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
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
