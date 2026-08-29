import type { EmployeeStatus } from './types'

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: 'Aktivan',
  INACTIVE: 'Neaktivan',
}

export const employeeStatusColors: Record<EmployeeStatus, 'success' | 'default'> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
}
