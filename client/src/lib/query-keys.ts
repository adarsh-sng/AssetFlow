export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
  assets: {
    all: ['assets'] as const,
    lists: () => [...queryKeys.assets.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.assets.lists(), filters] as const,
    details: () => [...queryKeys.assets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assets.details(), id] as const,
  },
  departments: {
    all: ['departments'] as const,
    lists: () => [...queryKeys.departments.all, 'list'] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
  },
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
  },
  allocations: {
    all: ['allocations'] as const,
    lists: () => [...queryKeys.allocations.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.allocations.lists(), filters] as const,
  },
  transfers: {
    all: ['transfers'] as const,
    lists: () => [...queryKeys.transfers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.transfers.lists(), filters] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.bookings.lists(), filters] as const,
  },
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.maintenance.lists(), filters] as const,
  },
  audits: {
    all: ['audits'] as const,
    lists: () => [...queryKeys.audits.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.audits.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.audits.all, 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.notifications.lists(), filters] as const,
  },
  reports: {
    all: ['reports'] as const,
    utilization: () => [...queryKeys.reports.all, 'utilization'] as const,
    maintenanceFrequency: () => [...queryKeys.reports.all, 'maintenance-frequency'] as const,
    assetUsage: () => [...queryKeys.reports.all, 'asset-usage'] as const,
    bookingHeatmap: () => [...queryKeys.reports.all, 'booking-heatmap'] as const,
  },
} as const
