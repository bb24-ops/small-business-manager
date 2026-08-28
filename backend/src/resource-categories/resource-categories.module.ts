import { Module } from '@nestjs/common';
import { ResourceCategoriesController } from './resource-categories.controller.js';
import { ResourceCategoriesService } from './resource-categories.service.js';

@Module({
  controllers: [ResourceCategoriesController],
  providers: [ResourceCategoriesService],
})
export class ResourceCategoriesModule {}
