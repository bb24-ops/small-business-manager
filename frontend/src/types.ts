export type ResourceStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE'
export interface ResourceCategory { id: string; name: string; description?: string | null; _count?: { resources: number } }
export interface Resource { id: string; name: string; code: string; description?: string | null; location?: string | null; status: ResourceStatus; categoryId: string; category: ResourceCategory; createdAt: string; updatedAt: string }
export interface ResourcePayload { name: string; code: string; description?: string; location?: string; status: ResourceStatus; categoryId: string }

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export interface Task { id: string; title: string; description?: string | null; startsAt: string; dueAt: string; priority: TaskPriority; status: TaskStatus; createdAt: string; updatedAt: string }
export interface TaskPayload { title: string; description?: string; startsAt: string; dueAt: string; priority: TaskPriority; status: TaskStatus }

export interface DashboardStats {
  totalResources: number
  totalCategories: number
  byStatus: Record<ResourceStatus, number>
  byCategory: Array<{ id: string; name: string; count: number }>
  recentResources: Resource[]
  totalTasks: number
  taskByStatus: Record<TaskStatus, number>
  upcomingTasks: Task[]
}
