import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, ChevronRight } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { AssetCategory, Department, Employee } from '../lib/types'

type Tab = 'departments' | 'categories' | 'employees'

const tabs: { key: Tab; label: string }[] = [
  { key: 'departments', label: 'Departments' },
  { key: 'categories', label: 'Categories' },
  { key: 'employees', label: 'Employees' },
]

export function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>('departments')

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: queryKeys.departments.lists(),
    queryFn: () => api.get<Department[]>('/organization/departments'),
    refetchInterval: 15000,
  })

  const { data: categories = [] } = useQuery<AssetCategory[]>({
    queryKey: ['categories', 'list'],
    queryFn: () => api.get<AssetCategory[]>('/organization/categories'),
    refetchInterval: 15000,
  })

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: queryKeys.employees.lists(),
    queryFn: () => api.get<Employee[]>('/organization/employees'),
    refetchInterval: 15000,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Organization Setup</h1>
        <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
          <Plus size={14} />
          Add
        </button>
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-foreground text-foreground'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'departments' && (
        <div className="border border-border-subtle bg-white shadow-custom">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Department
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Head
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Parent Dept
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-sm text-foreground/40">
                    No departments found.
                  </td>
                </tr>
              )}
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{dept.name}</td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {dept.head?.name ?? '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {dept.parent?.name ?? '-'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill variant={dept.status === 'ACTIVE' ? 'active' : 'warning'}>
                      {dept.status}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-4">
                    <ChevronRight size={16} className="text-foreground/30" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="border border-border-subtle bg-white shadow-custom">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Category
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Bookable
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-sm text-foreground/40">
                    No categories found.
                  </td>
                </tr>
              )}
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{category.name}</td>
                  <td className="px-5 py-4">
                    <StatusPill variant={category.defaultBookable ? 'active' : 'outlined'}>
                      {category.defaultBookable ? 'YES' : 'NO'}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {category.description ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="border border-border-subtle bg-white shadow-custom">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Employee
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Role
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Department
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-sm text-foreground/40">
                    No employees found.
                  </td>
                </tr>
              )}
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4">
                    <span className="block text-sm font-medium">{employee.name}</span>
                    <span className="text-xs text-foreground/40">{employee.email}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {employee.role.replace(/_/g, ' ')}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {employee.department?.name ?? '-'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill variant={employee.status === 'ACTIVE' ? 'active' : 'warning'}>
                      {employee.status}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-foreground/40">
        Organization changes are loaded directly from the local database.
      </p>
    </div>
  )
}
