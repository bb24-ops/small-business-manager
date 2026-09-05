import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testPrefix = `e2e-${Date.now()}`;
  const adminEmail = `${testPrefix}-admin@example.com`;
  const adminPassword = 'TestAdmin123!';
  let adminId: string;

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
    const admin = await prisma.user.create({
      data: { email: adminEmail, passwordHash: await hash(adminPassword, 4), role: 'ADMIN' },
    });
    adminId = admin.id;
    const token = await moduleFixture.get(JwtService).signAsync({
      sub: admin.id, id: admin.id, email: admin.email, role: admin.role, employeeId: null,
    });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      if (!req.headers.authorization) req.headers.authorization = `Bearer ${token}`;
      next();
    });
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

  it('logs in and rejects invalid credentials', async () => {
    await request(app.getHttpServer()).post('/api/auth/login').send({ email: adminEmail, password: 'pogresna-lozinka' }).expect(401);
    const response = await request(app.getHttpServer()).post('/api/auth/login').send({ email: adminEmail, password: adminPassword }).expect(201);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(response.body.user.role).toBe('ADMIN');
  });

  it('restricts employee accounts to their own data', async () => {
    const employee = await prisma.employee.create({
      data: { firstName: 'Auth', lastName: 'Test', email: `${testPrefix}-auth-employee@example.com`, position: 'Tester' },
    });
    const employeePassword = 'Employee123!';
    const account = await prisma.user.create({
      data: { email: `${testPrefix}-account@example.com`, passwordHash: await hash(employeePassword, 4), role: 'EMPLOYEE', employeeId: employee.id },
    });
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: account.email, password: employeePassword }).expect(201);
    const authorization = `Bearer ${login.body.accessToken}`;
    await request(app.getHttpServer()).get('/api/dashboard/stats').set('Authorization', authorization).expect(403);
    const tasks = await request(app.getHttpServer()).get('/api/tasks').set('Authorization', authorization).expect(200);
    expect(tasks.body).toEqual([]);
    await prisma.user.delete({ where: { id: account.id } });
    await prisma.employee.delete({ where: { id: employee.id } });
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
    expect(response.body.totalEmployees).toBeTypeOf('number');
    expect(response.body.activeEmployees).toBeTypeOf('number');
    expect(response.body.totalReservations).toBeTypeOf('number');
    expect(response.body.upcomingReservations).toBeInstanceOf(Array);

    const usageResponse = await request(app.getHttpServer())
      .get('/api/dashboard/resource-usage')
      .query({ days: 7 })
      .expect(200);
    expect(usageResponse.body.days).toBe(7);
    expect(usageResponse.body.points).toHaveLength(7);
    expect(usageResponse.body.peak.peakQuantity).toBeTypeOf('number');
    expect(usageResponse.body.averageQuantity).toBeTypeOf('number');
    const futureUsageResponse = await request(app.getHttpServer())
      .get('/api/dashboard/resource-usage')
      .query({ days: 30, direction: 'future' })
      .expect(200);
    expect(futureUsageResponse.body.direction).toBe('future');
    expect(futureUsageResponse.body.points).toHaveLength(30);
    const currentWeekResponse = await request(app.getHttpServer())
      .get('/api/dashboard/resource-usage')
      .query({ days: 7, direction: 'current-week' })
      .expect(200);
    expect(currentWeekResponse.body.direction).toBe('current-week');
    expect(currentWeekResponse.body.points).toHaveLength(7);
    await request(app.getHttpServer())
      .get('/api/dashboard/resource-usage')
      .query({ days: 10 })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/dashboard/resource-usage')
      .query({ days: 30, direction: 'invalid' })
      .expect(400);
  });

  it('creates, filters, updates and deletes a task', async () => {
    const employeeResponse = await request(app.getHttpServer())
      .post('/api/employees')
      .send({
        firstName: 'Test',
        lastName: 'Zaposleni',
        email: `${testPrefix}@example.com`,
        position: 'Tehničar',
      })
      .expect(201);
    const employeeId = employeeResponse.body.id as string;
    const secondEmployeeResponse = await request(app.getHttpServer())
      .post('/api/employees')
      .send({
        firstName: 'Drugi',
        lastName: 'Zaposleni',
        email: `${testPrefix}-drugi@example.com`,
        position: 'Tehničar',
      })
      .expect(201);
    const secondEmployeeId = secondEmployeeResponse.body.id as string;
    const thirdEmployeeResponse = await request(app.getHttpServer())
      .post('/api/employees')
      .send({
        firstName: 'Treći',
        lastName: 'Zaposleni',
        email: `${testPrefix}-treci@example.com`,
        position: 'Tehničar',
      })
      .expect(201);
    const thirdEmployeeId = thirdEmployeeResponse.body.id as string;
    const taskCategoryResponse = await request(app.getHttpServer())
      .post('/api/resource-categories')
      .send({ name: `${testPrefix}-Task-oprema` })
      .expect(201);
    const taskCategoryId = taskCategoryResponse.body.id as string;
    const taskResourceResponse = await request(app.getHttpServer())
      .post('/api/resources')
      .send({
        name: 'Test oprema',
        code: `${testPrefix}-TASK-001`,
        categoryId: taskCategoryId,
        quantity: 5,
      })
      .expect(201);
    const taskResourceId = taskResourceResponse.body.id as string;

    const taskResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} terenski zadatak`,
        description: 'E2E provera zadatka',
        startsAt: '2030-09-02T08:00:00.000Z',
        dueAt: '2030-09-02T12:00:00.000Z',
        priority: 'HIGH',
        employeeId,
        resources: [{ resourceId: taskResourceId, quantity: 2 }],
      })
      .expect(201);

    const taskId = taskResponse.body.id as string;
    const listResponse = await request(app.getHttpServer())
      .get('/api/tasks')
      .query({ search: testPrefix, priority: 'HIGH' })
      .expect(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].reservations[0].resource.id).toBe(taskResourceId);
    expect(listResponse.body[0].reservations[0].quantity).toBe(2);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} konflikt zaposlenog`,
        startsAt: '2030-09-02T09:00:00.000Z',
        dueAt: '2030-09-02T10:00:00.000Z',
        employeeId,
        resources: [{ resourceId: taskResourceId, quantity: 1 }],
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toContain('već ima aktivan zadatak');
      });

    const overlappingResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} dozvoljeno preklapanje`,
        startsAt: '2030-09-02T10:00:00.000Z',
        dueAt: '2030-09-02T13:00:00.000Z',
        employeeId: secondEmployeeId,
        resources: [{ resourceId: taskResourceId, quantity: 3 }],
      })
      .expect(201);
    const overlappingTaskId = overlappingResponse.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/tasks/${overlappingTaskId}`)
      .send({ employeeId })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} konflikt kapaciteta`,
        startsAt: '2030-09-02T11:00:00.000Z',
        dueAt: '2030-09-02T12:00:00.000Z',
        employeeId: thirdEmployeeId,
        resources: [{ resourceId: taskResourceId, quantity: 1 }],
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toContain('dostupno je najviše');
      });

    const adjacentResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} susedni termin`,
        startsAt: '2030-09-02T13:00:00.000Z',
        dueAt: '2030-09-02T14:00:00.000Z',
        employeeId,
        resources: [{ resourceId: taskResourceId, quantity: 5 }],
      })
      .expect(201);
    const adjacentTaskId = adjacentResponse.body.id as string;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .send({ priority: 'URGENT' })
      .expect(200);
    expect(updateResponse.body.priority).toBe('URGENT');
    expect(updateResponse.body.status).toBe('TODO');

    const now = Date.now();
    const currentTaskResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: `${testPrefix} trenutni zadatak`,
        startsAt: new Date(now - 30 * 60_000).toISOString(),
        dueAt: new Date(now + 30 * 60_000).toISOString(),
        employeeId: thirdEmployeeId,
        resources: [{ resourceId: taskResourceId, quantity: 1 }],
      })
      .expect(201);
    const currentTaskId = currentTaskResponse.body.id as string;
    expect(currentTaskResponse.body.status).toBe('IN_PROGRESS');

    const resourcesWhileActive = await request(app.getHttpServer()).get('/api/resources').expect(200);
    const activeResource = resourcesWhileActive.body.find((resource: { id: string }) => resource.id === taskResourceId);
    expect(activeResource.currentStatus).toBe('IN_USE');
    expect(activeResource.currentQuantityInUse).toBe(1);

    const employeesWhileActive = await request(app.getHttpServer()).get('/api/employees').expect(200);
    const busyEmployee = employeesWhileActive.body.find((employee: { id: string }) => employee.id === thirdEmployeeId);
    expect(busyEmployee.isCurrentlyBusy).toBe(true);

    const completedResponse = await request(app.getHttpServer())
      .patch(`/api/tasks/${currentTaskId}/complete`)
      .expect(200);
    expect(completedResponse.body.status).toBe('DONE');
    expect(completedResponse.body.completedAt).toBeTypeOf('string');

    const resourcesAfterCompletion = await request(app.getHttpServer()).get('/api/resources').expect(200);
    const releasedResource = resourcesAfterCompletion.body.find((resource: { id: string }) => resource.id === taskResourceId);
    expect(releasedResource.currentStatus).toBe('AVAILABLE');
    expect(releasedResource.currentQuantityInUse).toBe(0);

    const employeesAfterCompletion = await request(app.getHttpServer()).get('/api/employees').expect(200);
    const releasedEmployee = employeesAfterCompletion.body.find((employee: { id: string }) => employee.id === thirdEmployeeId);
    expect(releasedEmployee.isCurrentlyBusy).toBe(false);

    await request(app.getHttpServer())
      .patch(`/api/resources/${taskResourceId}`)
      .send({ quantity: 4 })
      .expect(409);

    await request(app.getHttpServer()).delete(`/api/employees/${employeeId}`).expect(409);

    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .send({ dueAt: '2030-09-02T07:00:00.000Z' })
      .expect(400);
    await request(app.getHttpServer()).delete(`/api/tasks/${taskId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/tasks/${overlappingTaskId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/tasks/${adjacentTaskId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/tasks/${currentTaskId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/employees/${employeeId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/employees/${secondEmployeeId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/employees/${thirdEmployeeId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/resources/${taskResourceId}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/resource-categories/${taskCategoryId}`).expect(204);
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
        quantity: 3,
      })
      .expect(201);

    const resourceId = resourceResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/resources')
      .query({ search: testPrefix })
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].category.id).toBe(categoryId);
    expect(listResponse.body[0].quantity).toBe(3);

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
    await prisma.employee.deleteMany({
      where: { email: { startsWith: testPrefix } },
    });
    await prisma.resource.deleteMany({
      where: { code: { startsWith: testPrefix } },
    });
    await prisma.resourceCategory.deleteMany({
      where: { name: { startsWith: testPrefix } },
    });
    await prisma.user.deleteMany({ where: { id: adminId } });
    await app.close();
  });
});
