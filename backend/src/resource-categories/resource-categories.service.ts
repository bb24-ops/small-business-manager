import { Injectable, NotFoundException } from '@nestjs/common';
import { throwPrismaConflict } from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateResourceCategoryDto } from './dto/create-resource-category.dto.js';
import { UpdateResourceCategoryDto } from './dto/update-resource-category.dto.js';

@Injectable()
export class ResourceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.resourceCategory.findMany({
      include: { _count: { select: { resources: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.resourceCategory.findUnique({
      where: { id },
      include: { _count: { select: { resources: true } } },
    });

    if (!category) {
      throw new NotFoundException('Kategorija resursa nije pronađena.');
    }

    return category;
  }

  async create(dto: CreateResourceCategoryDto) {
    try {
      return await this.prisma.resourceCategory.create({ data: dto });
    } catch (error) {
      throwPrismaConflict(error, 'Kategorija sa ovim nazivom već postoji.');
    }
  }

  async update(id: string, dto: UpdateResourceCategoryDto) {
    await this.findOne(id);

    try {
      return await this.prisma.resourceCategory.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throwPrismaConflict(error, 'Kategorija sa ovim nazivom već postoji.');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.resourceCategory.delete({ where: { id } });
    } catch (error) {
      throwPrismaConflict(
        error,
        'Kategorija se ne može obrisati dok sadrži resurse.',
      );
    }
  }
}
