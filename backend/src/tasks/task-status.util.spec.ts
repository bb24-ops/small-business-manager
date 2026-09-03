import { TaskStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { getAutomaticTaskStatus } from './task-status.util.js';

describe('getAutomaticTaskStatus', () => {
  const now = new Date('2026-09-03T12:00:00.000Z');

  it('returns TODO before the planned start', () => {
    expect(
      getAutomaticTaskStatus(
        new Date('2026-09-03T13:00:00.000Z'),
        new Date('2026-09-03T14:00:00.000Z'),
        now,
      ),
    ).toBe(TaskStatus.TODO);
  });

  it('returns IN_PROGRESS during the planned period', () => {
    expect(
      getAutomaticTaskStatus(
        new Date('2026-09-03T11:00:00.000Z'),
        new Date('2026-09-03T13:00:00.000Z'),
        now,
      ),
    ).toBe(TaskStatus.IN_PROGRESS);
  });

  it('returns OVERDUE after the deadline', () => {
    expect(
      getAutomaticTaskStatus(
        new Date('2026-09-03T10:00:00.000Z'),
        new Date('2026-09-03T11:00:00.000Z'),
        now,
      ),
    ).toBe(TaskStatus.OVERDUE);
  });
});
