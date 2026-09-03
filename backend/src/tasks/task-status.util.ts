import { PrismaClient, TaskStatus } from '@prisma/client';

type TaskStatusDatabase = Pick<PrismaClient, 'task'>;

export function getAutomaticTaskStatus(startsAt: Date, dueAt: Date, now = new Date()) {
  if (dueAt <= now) return TaskStatus.OVERDUE;
  if (startsAt <= now) return TaskStatus.IN_PROGRESS;
  return TaskStatus.TODO;
}

export async function synchronizeTaskStatuses(database: TaskStatusDatabase, now = new Date()) {
  await database.task.updateMany({
    where: { status: { not: TaskStatus.DONE }, dueAt: { lte: now } },
    data: { status: TaskStatus.OVERDUE },
  });
  await database.task.updateMany({
    where: {
      status: { not: TaskStatus.DONE },
      startsAt: { lte: now },
      dueAt: { gt: now },
    },
    data: { status: TaskStatus.IN_PROGRESS },
  });
  await database.task.updateMany({
    where: { status: { not: TaskStatus.DONE }, startsAt: { gt: now } },
    data: { status: TaskStatus.TODO },
  });
}
