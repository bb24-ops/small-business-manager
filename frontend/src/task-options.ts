import type { TaskPriority, TaskStatus } from './types'

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'Za uraditi',
  IN_PROGRESS: 'U toku',
  DONE: 'Završeno',
}

export const taskStatusColors: Record<TaskStatus, 'default' | 'info' | 'success'> = {
  TODO: 'default',
  IN_PROGRESS: 'info',
  DONE: 'success',
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: 'Nizak',
  MEDIUM: 'Srednji',
  HIGH: 'Visok',
  URGENT: 'Hitan',
}

export const taskPriorityColors: Record<TaskPriority, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
}
