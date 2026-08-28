import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testPrefix = `e2e-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.timestamp).toBeTypeOf('string');
      });
  });

  it('validates resource category input', () => {
    return request(app.getHttpServer())
      .post('/api/resource-categories')
      .send({ name: 'A' })
      .expect(400);
  });

  it('returns dashboard statistics', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard/stats')
      .expect(200);

    expect(response.body.totalResources).toBeTypeOf('number');
    expect(response.body.totalCategories).toBeTypeOf('number');
    expect(response.body.byStatus.AVAILABLE).toBeTypeOf('number');
    expect(response.body.byCategory).toBeInstanceOf(Array);
    expect(response.body.recentResources).toBeInstanceOf(Array);
    expect(response.body.totalTasks).toBeTypeOf('number');
    expect(response.body.taskByStatus.TODO).toBeTypeOf('number');
    expect(response.body.upcomingTasks).toBeInstanceOf(Array);
  });

  it('creates, filters, updates and deletes a task', async () => {
    const taskResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} terenski zadatak`,
        description: 'E2E provera zadatka',
        startsAt: '2026-09-02T08:00:00.000Z',
        dueAt: '2026-09-02T12:00:00.000Z',
        priority: 'HIGH',
      })
      .expect(201);

    const taskId = taskResponse.body.id as string;
    const listResponse = await request(app.getHttpServer())
      .get('/api/tasks')
      .query({ search: testPrefix, priority: 'HIGH' })
      .expect(200);
    expect(listResponse.body).toHaveLength(1);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    expect(updateResponse.body.status).toBe('IN_PROGRESS');

    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .send({ dueAt: '2026-09-02T07:00:00.000Z' })
      .expect(400);
    await request(app.getHttpServer()).delete(`/api/tasks/${taskId}`).expect(204);
  });

  it('creates, filters, updates and deletes a resource', async () => {
    const categoryResponse = await request(app.getHttpServer())
      .post('/api/resource-categories')
      .send({ name: `${testPrefix}-Vozila` })
      .expect(201);

    const categoryId = categoryResponse.body.id as string;
    const resourceResponse = await request(app.getHttpServer())
      .post('/api/resources')
      .send({
        name: 'Test vozilo',
        code: `${testPrefix}-001`,
        categoryId,
        location: 'Test garaža',
      })
      .expect(201);

    const resourceId = resourceResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/resources')
      .query({ search: testPrefix })
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].category.id).toBe(categoryId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/resources/${resourceId}`)
      .send({ status: 'MAINTENANCE' })
      .expect(200);

    expect(updateResponse.body.status).toBe('MAINTENANCE');

    await request(app.getHttpServer())
      .delete(`/api/resources/${resourceId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/resource-categories/${categoryId}`)
      .expect(204);
  });

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: { title: { startsWith: testPrefix } },
    });
    await prisma.resource.deleteMany({
      where: { code: { startsWith: testPrefix } },
    });
    await prisma.resourceCategory.deleteMany({
      where: { name: { startsWith: testPrefix } },
    });
    await app.close();
  });
});
