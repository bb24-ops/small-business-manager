import type { DashboardStats, Employee, EmployeePayload, EmployeeStatus, Resource, ResourceCategory, ResourcePayload, ResourceStatus, Task, TaskPayload, TaskPriority, TaskStatus } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message
    throw new ApiError(message ?? 'Došlo je do greške pri komunikaciji.', response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  health: () => apiRequest<{ status: string; timestamp: string }>('/health'),
  dashboard: {
    stats: () => apiRequest<DashboardStats>('/dashboard/stats'),
  },
  categories: {
    list: () => apiRequest<ResourceCategory[]>('/resource-categories'),
    create: (payload: { name: string; description?: string }) => apiRequest<ResourceCategory>('/resource-categories', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id: string) => apiRequest<void>(`/resource-categories/${id}`, { method: 'DELETE' }),
  },
  resources: {
    list: (filters: { search?: string; status?: ResourceStatus | ''; categoryId?: string }) => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      if (filters.categoryId) params.set('categoryId', filters.categoryId)
      const query = params.toString()
      return apiRequest<Resource[]>(`/resources${query ? `?${query}` : ''}`)
    },
    create: (payload: ResourcePayload) => apiRequest<Resource>('/resources', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: ResourcePayload) => apiRequest<Resource>(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id: string) => apiRequest<void>(`/resources/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (filters: { search?: string; status?: TaskStatus | ''; priority?: TaskPriority | '' }) => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      const query = params.toString()
      return apiRequest<Task[]>(`/tasks${query ? `?${query}` : ''}`)
    },
    create: (payload: TaskPayload) => apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<TaskPayload>) => apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },
  employees: {
    list: (filters: { search?: string; status?: EmployeeStatus | '' } = {}) => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      const query = params.toString()
      return apiRequest<Employee[]>(`/employees${query ? `?${query}` : ''}`)
    },
    create: (payload: EmployeePayload) => apiRequest<Employee>('/employees', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: EmployeePayload) => apiRequest<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id: string) => apiRequest<void>(`/employees/${id}`, { method: 'DELETE' }),
  },
}
