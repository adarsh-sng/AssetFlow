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
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
  },
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
  },
  audits: {
    all: ['audits'] as const,
    lists: () => [...queryKeys.audits.all, 'list'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
  },
} as const
