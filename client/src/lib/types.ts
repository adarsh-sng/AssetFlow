export interface Employee {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'
  departmentId: string | null
  department?: Department
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface Department {
  id: string
  name: string
  headId: string | null
  head?: { id: string; name: string; email: string } | null
  parentId: string | null
  parent?: { id: string; name: string } | null
  status: 'ACTIVE' | 'INACTIVE'
}

export interface AssetCategory {
  id: string
  name: string
  description?: string
  defaultBookable?: boolean
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface Asset {
  id: string
  tag: string
  name: string
  serialNumber: string
  categoryId: string
  category?: AssetCategory
  status: AssetStatus
  condition: string
  location: string
  departmentId?: string
}

export type AssetStatus =
  | 'AVAILABLE'
  | 'ALLOCATED'
  | 'RESERVED'
  | 'UNDER_MAINTENANCE'
  | 'LOST'
  | 'RETIRED'
  | 'DISPOSED'

export interface DashboardStats {
  available: number
  allocated: number
  inRepair: number
  bookings: number
  pending: number
  returns: number
  overdue: number
}

export interface ActivityLog {
  id: string
  message: string
  timestamp: string
  type: 'allocation' | 'booking' | 'maintenance' | 'system'
}

// ── Server response types (what the API actually returns) ──

export interface ServerAsset {
  id: string
  tag: string
  name: string
  serialNumber: string | null
  qrCode: string | null
  status: AssetStatus
  condition: string | null
  location: string | null
  isBookable: boolean
  acquisitionDate: string | null
  acquisitionCost: string | null
  warrantyExpiresAt: string | null
  retirementDueAt: string | null
  photoUrl: string | null
  documentUrl: string | null
  categoryId: string
  category: { id: string; name: string }
  departmentId: string | null
  department: { id: string; name: string } | null
  createdAt: string
}

export interface ServerAssetDetail extends ServerAsset {
  allocations: ServerAllocation[]
  maintenanceRequests: { id: string; status: string; issue: string }[]
}

export interface ServerAllocation {
  id: string
  assetId: string
  asset: { id: string; tag: string; name: string; status: AssetStatus }
  targetType: 'EMPLOYEE' | 'DEPARTMENT'
  employeeId: string | null
  employee: { id: string; name: string; email: string } | null
  departmentId: string | null
  department: { id: string; name: string } | null
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED'
  allocatedAt: string
  expectedReturnAt: string | null
  returnedAt: string | null
  checkOutNotes: string | null
  checkInNotes: string | null
  returnCondition: string | null
}

export interface ServerTransfer {
  id: string
  assetId: string
  asset: { id: string; tag: string; name: string }
  fromAllocationId: string | null
  toTargetType: 'EMPLOYEE' | 'DEPARTMENT'
  toEmployeeId: string | null
  toEmployee: { id: string; name: string; email: string } | null
  toDepartmentId: string | null
  toDepartment: { id: string; name: string } | null
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  requestedById: string | null
  requestedBy: { id: string; name: string; email: string } | null
  approvedById: string | null
  approvedBy: { id: string; name: string; email: string } | null
  decidedAt: string | null
  createdAt: string
}

export interface ServerBooking {
  id: string
  assetId: string
  asset: { id: string; name: string }
  requestedById: string | null
  requestedBy: { id: string; name: string; email: string } | null
  title: string
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  startsAt: string
  endsAt: string
  location: string | null
  notes: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface ServerMaintenanceRequest {
  id: string
  assetId: string
  asset: { id: string; tag: string; name: string }
  issue: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'TECHNICIAN_ASSIGNED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
  attachmentUrl: string | null
  requestedById: string | null
  requestedBy: { id: string; name: string; email: string } | null
  approvedById: string | null
  approvedBy: { id: string; name: string; email: string } | null
  technicianId: string | null
  technician: { id: string; name: string; email: string } | null
  approvedAt: string | null
  startedAt: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  createdAt: string
}

export interface ServerAuditCycle {
  id: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
  scope: string
  departmentId: string | null
  department: { id: string; name: string } | null
  location: string | null
  startsAt: string
  endsAt: string
  closedAt: string | null
  assignments: { auditor: { id: string; name: string } }[]
  _count: { items: number }
  createdAt: string
}

export interface ServerAuditCycleDetail extends ServerAuditCycle {
  items: {
    id: string
    assetId: string
    asset: { id: string; tag: string; name: string }
    expectedLocation: string | null
    actualLocation: string | null
    status: 'PENDING' | 'VERIFIED' | 'MISSING' | 'DAMAGED'
    verifiedBy: { id: string; name: string } | null
    notes: string | null
  }[]
}

export interface ServerNotification {
  id: string
  recipientId: string | null
  type: 'ASSET' | 'BOOKING' | 'MAINTENANCE' | 'TRANSFER' | 'AUDIT' | 'OVERDUE' | 'SYSTEM'
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

export interface ServerCategory {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  defaultBookable: boolean
  createdAt: string
}

export interface ServerEmployee {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'
  status: 'ACTIVE' | 'INACTIVE'
  departmentId: string | null
  department: { id: string; name: string } | null
}

export interface ServerActivityLog {
  id: string
  message: string
  timestamp: string
  actor: string
  type: string
}

export interface UtilizationReport {
  departmentId: string
  department: string
  assets: number
  activeAllocations: number
}

export interface MaintenanceFrequencyReport {
  assetId: string
  tag: string
  name: string
  category: string
  count: number
}

export interface AssetUsageReport {
  mostUsed: { asset: { id: string; tag: string; name: string }; count: number }[]
  idle: { id: string; tag: string; name: string }[]
}

export interface BookingHeatmapEntry {
  day: string
  hour: number
  count: number
}
