export interface Employee {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'
  departmentId: string
  department?: Department
}

export interface Department {
  id: string
  name: string
  headId?: string
  parentDepartmentId?: string
  status: 'ACTIVE' | 'INACTIVE'
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
  allocatedToId?: string
}

export type AssetStatus =
  | 'AVAILABLE'
  | 'ALLOCATED'
  | 'IN_REPAIR'
  | 'MAINTENANCE'
  | 'RETIRED'
  | 'LOST'

export interface AssetCategory {
  id: string
  name: string
  description?: string
}

export interface DashboardStats {
  available: number
  allocated: number
  inRepair: number
  bookings: number
  pending: number
  returns: number
}

export interface ActivityLog {
  id: string
  message: string
  timestamp: string
  type: 'allocation' | 'booking' | 'maintenance' | 'system'
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
