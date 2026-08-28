import type { ResourceStatus } from './types'

export const statusLabels: Record<ResourceStatus, string> = {
  AVAILABLE: 'Dostupan',
  IN_USE: 'U upotrebi',
  MAINTENANCE: 'Na servisu',
  UNAVAILABLE: 'Nedostupan',
}

export const statusColors: Record<
  ResourceStatus,
  'success' | 'info' | 'warning' | 'default'
> = {
  AVAILABLE: 'success',
  IN_USE: 'info',
  MAINTENANCE: 'warning',
  UNAVAILABLE: 'default',
}
