export interface Employee {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'
  status: 'ACTIVE' | 'INACTIVE'
  departmentId: string | null
  department?: Department
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
  description?: string | null
  defaultBookable?: boolean
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
