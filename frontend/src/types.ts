export type ResourceStatus =
  "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "UNAVAILABLE";
export interface ResourceCategory {
  id: string;
  name: string;
  description?: string | null;
  _count?: { resources: number };
}
export interface Resource {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  location?: string | null;
  status: ResourceStatus;
  currentStatus: ResourceStatus;
  quantity: number;
  currentQuantityInUse: number;
  currentQuantityAvailable: number;
  categoryId: string;
  category: ResourceCategory;
  createdAt: string;
  updatedAt: string;
}
export interface ResourcePayload {
  name: string;
  code: string;
  description?: string;
  location?: string;
  status: ResourceStatus;
  quantity: number;
  categoryId: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "OVERDUE" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type EmployeeStatus = "ACTIVE" | "INACTIVE";
export type UserRole = "ADMIN" | "EMPLOYEE";
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
  employee?: { firstName: string; lastName: string } | null;
}
export interface UserAccount extends AuthUser {
  isActive: boolean;
  employee?: { id: string; firstName: string; lastName: string; position: string } | null;
  createdAt: string;
  updatedAt: string;
}
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position: string;
  status: EmployeeStatus;
  isCurrentlyBusy: boolean;
  currentTask?: { id: string; title: string; dueAt: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
}
export interface EmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  status: EmployeeStatus;
}
export interface ResourceAllocation {
  resourceId: string;
  quantity: number;
}
export interface Reservation {
  id: string;
  taskId: string;
  resourceId: string;
  startsAt: string;
  endsAt: string;
  quantity: number;
  task: Task;
  resource: Resource;
  createdAt: string;
  updatedAt: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  dueAt: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string | null;
  employeeId?: string | null;
  employee?: Employee | null;
  reservations: Array<Omit<Reservation, "task">>;
  createdAt: string;
  updatedAt: string;
}
export interface TaskPayload {
  title: string;
  description?: string;
  startsAt: string;
  dueAt: string;
  priority: TaskPriority;
  employeeId: string;
  resources: ResourceAllocation[];
}

export interface DashboardStats {
  totalResources: number;
  totalCategories: number;
  byStatus: Record<ResourceStatus, number>;
  byCategory: Array<{ id: string; name: string; count: number }>;
  recentResources: Resource[];
  totalTasks: number;
  taskByStatus: Record<TaskStatus, number>;
  upcomingTasks: Task[];
  totalEmployees: number;
  activeEmployees: number;
  busyEmployees: number;
  availableEmployees: number;
  totalReservations: number;
  upcomingReservations: Reservation[];
}

export interface ResourceUsagePoint {
  date: string;
  peakQuantity: number;
}
export interface ResourceUsageStats {
  days: number;
  direction: "past" | "current-week" | "future";
  capacity: number;
  averageQuantity: number;
  peak: ResourceUsagePoint;
  points: ResourceUsagePoint[];
}
