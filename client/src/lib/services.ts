const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// --- Dashboard ---

export interface DashboardStats {
  available: number
  allocated: number
  inRepair: number
  bookings: number
  pending: number
  returns: number
  overdue: number
}

export interface ActivityItem {
  id: string
  message: string
  timestamp: string
  type: string
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>('/dashboard/stats')
}

export async function fetchDashboardActivity(): Promise<ActivityItem[]> {
  const logs = await api.get<Array<{ id: string; message: string; timestamp: string; type: string }>>(
    '/dashboard/activity'
  )
  return logs.map((log) => ({
    id: log.id,
    message: log.message,
    timestamp: log.timestamp,
    type: log.type,
  }))
}

// --- Assets ---

export interface AssetRow {
  id: string
  tag: string
  name: string
  category: string
  status: string
  location: string
}

export async function fetchAssets(search = ''): Promise<AssetRow[]> {
  const params = new URLSearchParams()
  if (search) params.set('q', search)

  const assets = await api.get<
    Array<{
      id: string
      tag: string
      name: string
      status: string
      location: string | null
      category: { name: string }
    }>
  >(`/assets?${params}`)

  return assets.map((asset) => ({
    id: asset.id,
    tag: asset.tag,
    name: asset.name,
    category: asset.category.name,
    status: asset.status,
    location: asset.location ?? '—',
  }))
}

export interface AllocationAssetOption {
  id: string
  tag: string
  name: string
  status: string
  currentHolder?: string
  currentHolderDept?: string
}

export async function fetchAllocationAssets(): Promise<AllocationAssetOption[]> {
  const [assets, allocations] = await Promise.all([
    api.get<
      Array<{
        id: string
        tag: string
        name: string
        status: string
        department: { name: string } | null
      }>
    >('/assets'),
    api.get<
      Array<{
        status: string
        assetId: string
        employee: { name: string; department?: { name: string } } | null
        department: { name: string } | null
      }>
    >('/allocations?status=ACTIVE'),
  ])

  const activeByAsset = new Map(
    allocations
      .filter((a) => a.status === 'ACTIVE')
      .map((a) => [a.assetId, a])
  )

  return assets.map((asset) => {
    const active = activeByAsset.get(asset.id)
    return {
      id: asset.id,
      tag: asset.tag,
      name: asset.name,
      status: active ? 'ALLOCATED' : asset.status === 'AVAILABLE' ? 'AVAILABLE' : asset.status,
      currentHolder: active?.employee?.name ?? active?.department?.name,
      currentHolderDept: active?.employee
        ? asset.department?.name
        : active?.department?.name,
    }
  })
}

// --- Allocations ---

export interface AllocationRow {
  id: string
  assetTag: string
  assetName: string
  allocatedTo: string
  targetType: 'EMPLOYEE' | 'DEPARTMENT'
  expectedReturnAt: string | null
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED'
  isOverdue: boolean
}

export async function fetchAllocations(search = ''): Promise<AllocationRow[]> {
  const params = new URLSearchParams()
  if (search) params.set('q', search)

  const allocations = await api.get<
    Array<{
      id: string
      targetType: 'EMPLOYEE' | 'DEPARTMENT'
      expectedReturnAt: string | null
      status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED'
      asset: { tag: string; name: string }
      employee: { name: string } | null
      department: { name: string } | null
    }>
  >(`/allocations?${params}`)

  const now = Date.now()

  return allocations.map((a) => ({
    id: a.id,
    assetTag: a.asset.tag,
    assetName: a.asset.name,
    allocatedTo: a.employee?.name ?? a.department?.name ?? '—',
    targetType: a.targetType,
    expectedReturnAt: a.expectedReturnAt,
    status: a.status,
    isOverdue:
      a.status === 'ACTIVE' &&
      !!a.expectedReturnAt &&
      new Date(a.expectedReturnAt).getTime() < now,
  }))
}

// --- Bookings ---

export interface BookableResource {
  id: string
  name: string
  type: 'ROOM' | 'EQUIPMENT'
}

export interface BookingRow {
  id: string
  resourceId: string
  resourceName: string
  bookedBy: string
  department: string
  date: string
  startTime: string
  endTime: string
  startHour: number
  endHour: number
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
}

export async function fetchBookableResources(): Promise<BookableResource[]> {
  const assets = await api.get<
    Array<{
      id: string
      name: string
      category: { name: string }
    }>
  >('/assets?bookable=true')

  return assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.category.name === 'Rooms' ? 'ROOM' : 'EQUIPMENT',
  }))
}

export async function fetchBookings(search = ''): Promise<BookingRow[]> {
  const bookings = await api.get<
    Array<{
      id: string
      assetId: string
      title: string
      status: BookingRow['status']
      startsAt: string
      endsAt: string
      asset: { name: string }
      requestedBy: { name: string; department?: { name: string } } | null
    }>
  >('/bookings')

  return bookings
    .filter((b) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        b.asset.name.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        (b.requestedBy?.name.toLowerCase().includes(q) ?? false)
      )
    })
    .map((b) => {
      const startsAt = new Date(b.startsAt)
      const endsAt = new Date(b.endsAt)
      return {
        id: b.id,
        resourceId: b.assetId,
        resourceName: b.asset.name,
        bookedBy: b.title || b.requestedBy?.name || '—',
        department: '—',
        date: formatDateOnly(startsAt),
        startTime: formatTime(startsAt),
        endTime: formatTime(endsAt),
        startHour: startsAt.getHours(),
        endHour: endsAt.getHours(),
        status: b.status,
      }
    })
}

// --- Maintenance ---

export interface MaintenanceTicket {
  id: string
  assetTag: string
  assetName: string
  issue: string
  status: string
  technician?: string
  resolvedDate?: string
}

export async function fetchMaintenanceTickets(search = ''): Promise<MaintenanceTicket[]> {
  const params = new URLSearchParams()
  if (search) params.set('q', search)

  const tickets = await api.get<
    Array<{
      id: string
      issue: string
      status: string
      resolvedAt: string | null
      asset: { tag: string; name: string }
      technician: { name: string } | null
    }>
  >(`/maintenance?${params}`)

  return tickets.map((t) => ({
    id: t.id,
    assetTag: t.asset.tag,
    assetName: t.asset.name,
    issue: t.issue,
    status: t.status,
    technician: t.technician?.name,
    resolvedDate: t.resolvedAt ? formatDateOnly(new Date(t.resolvedAt)) : undefined,
  }))
}

// --- Audits ---

export interface AuditCycleSummary {
  id: string
  name: string
  department: string
  dateRange: string
  auditors: string[]
  status: 'IN_PROGRESS' | 'COMPLETED'
}

export interface AuditItemRow {
  id: string
  assetTag: string
  assetName: string
  expectedLocation: string
  verification: 'VERIFIED' | 'MISSING' | 'DAMAGED' | 'PENDING'
}

export async function fetchActiveAudit(): Promise<{
  cycle: AuditCycleSummary | null
  items: AuditItemRow[]
}> {
  const audits = await api.get<
    Array<{
      id: string
      name: string
      status: string
      startsAt: string
      endsAt: string
      department: { name: string } | null
      assignments: Array<{ auditor: { name: string } }>
    }>
  >('/audits?status=ACTIVE')

  const active = audits[0]
  if (!active) {
    return { cycle: null, items: [] }
  }

  const detail = await api.get<{
    id: string
    name: string
    status: string
    startsAt: string
    endsAt: string
    department: { name: string } | null
    assignments: Array<{ auditor: { name: string } }>
    items: Array<{
      id: string
      expectedLocation: string | null
      status: AuditItemRow['verification']
      asset: { tag: string; name: string }
    }>
  }>(`/audits/${active.id}`)

  const start = new Date(detail.startsAt)
  const end = new Date(detail.endsAt)
  const dateRange = `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`

  return {
    cycle: {
      id: detail.id,
      name: detail.name,
      department: detail.department?.name ?? 'All departments',
      dateRange,
      auditors: detail.assignments.map((a) => a.auditor.name),
      status: detail.status === 'CLOSED' ? 'COMPLETED' : 'IN_PROGRESS',
    },
    items: detail.items.map((item) => ({
      id: item.id,
      assetTag: item.asset.tag,
      assetName: item.asset.name,
      expectedLocation: item.expectedLocation ?? '—',
      verification: item.status,
    })),
  }
}

// --- Notifications ---

export interface NotificationRow {
  id: string
  message: string
  timestamp: string
  type: string
}

const notificationTypeMap: Record<string, string> = {
  ASSET: 'allocation',
  BOOKING: 'booking',
  MAINTENANCE: 'maintenance',
  TRANSFER: 'transfer',
  OVERDUE: 'overdue',
  AUDIT: 'audit',
  SYSTEM: 'system',
}

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const notifications = await api.get<
    Array<{
      id: string
      type: string
      title: string
      message: string
      createdAt: string
    }>
  >('/notifications')

  return notifications.map((n) => ({
    id: n.id,
    message: n.message,
    timestamp: formatRelativeTime(n.createdAt),
    type: notificationTypeMap[n.type] ?? 'system',
  }))
}

// --- Reports ---

export interface MostUsedAsset {
  name: string
  usage: string
}

export interface IdleAsset {
  name: string
  idleDays: string
}

export interface MaintenanceDue {
  name: string
  reason: string
}

export interface UtilizationRow {
  dept: string
  count: number
}

export async function fetchReports() {
  const [usage, utilization, maintenanceFreq, maintenanceTickets] = await Promise.all([
    api.get<{
      mostUsed: Array<{ asset: { tag: string; name: string } | undefined; count: number }>
      idle: Array<{ tag: string; name: string }>
    }>('/reports/asset-usage'),
    api.get<Array<{ department: string; activeAllocations: number }>>('/reports/utilization'),
    api.get<Array<{ count: number }>>('/reports/maintenance-frequency'),
    api.get<
      Array<{
        issue: string
        status: string
        asset: { tag: string; name: string }
      }>
    >('/maintenance'),
  ])

  const mostUsed: MostUsedAsset[] = usage.mostUsed
    .filter((row) => row.asset)
    .map((row) => ({
      name: `${row.asset!.name} ${row.asset!.tag}`,
      usage: `${row.count} booking${row.count === 1 ? '' : 's'}`,
    }))

  const idle: IdleAsset[] = usage.idle.map((asset) => ({
    name: `${asset.name} ${asset.tag}`,
    idleDays: 'unused 45+ days',
  }))

  const utilizationData: UtilizationRow[] = utilization.map((row) => ({
    dept: row.department.slice(0, 3),
    count: row.activeAllocations,
  }))

  const maintenanceFreqData = maintenanceFreq.map((row) => row.count)
  if (maintenanceFreqData.length === 0) {
    maintenanceFreqData.push(0)
  }

  const maintenanceDue: MaintenanceDue[] = maintenanceTickets
    .filter((t) => t.status !== 'RESOLVED' && t.status !== 'REJECTED')
    .slice(0, 5)
    .map((t) => ({
      name: `${t.asset.name} ${t.asset.tag}`,
      reason: t.issue,
    }))

  return { mostUsed, idle, utilizationData, maintenanceFreqData, maintenanceDue }
}

// --- Organization ---

export interface DepartmentRow {
  id: string
  name: string
  head: { id: string; name: string; email: string } | null
  parent: { id: string; name: string } | null
  status: 'ACTIVE' | 'INACTIVE'
}

export async function fetchDepartments(): Promise<DepartmentRow[]> {
  return api.get<DepartmentRow[]>('/organization/departments')
}

export { formatRelativeTime }
