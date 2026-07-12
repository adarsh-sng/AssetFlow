import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronRight } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { Department, ServerCategory, ServerEmployee } from '../lib/types'

type Tab = 'departments' | 'categories' | 'employees'

const tabs: { key: Tab; label: string }[] = [
  { key: 'departments', label: 'Departments' },
  { key: 'categories', label: 'Categories' },
  { key: 'employees', label: 'Employees' },
]

export function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>('departments')
  const queryClient = useQueryClient()

  const { data: departments = [], isLoading: deptsLoading, error: deptsError } = useQuery<Department[]>({
    queryKey: queryKeys.departments.lists(),
    queryFn: () => api.get<Department[]>('/organization/departments'),
  })

  const { data: categories = [], isLoading: catsLoading, error: catsError } = useQuery<ServerCategory[]>({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => api.get<ServerCategory[]>('/organization/categories'),
  })

  const { data: employees = [], isLoading: empsLoading, error: empsError } = useQuery<ServerEmployee[]>({
    queryKey: queryKeys.employees.lists(),
    queryFn: () => api.get<ServerEmployee[]>('/organization/employees'),
  })

  const isLoading = deptsLoading || catsLoading || empsLoading
  const error = deptsError || catsError || empsError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Organization Setup</h1>
        <div className="border border-border-subtle bg-white p-8 shadow-custom">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-foreground/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Organization Setup</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load organization data. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

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
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{dept.name}</td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {dept.head?.name ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {dept.parent?.name ?? '—'}
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
                  Description
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Bookable
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{cat.name}</td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {cat.description ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {cat.defaultBookable ? 'Yes' : 'No'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill variant={cat.status === 'ACTIVE' ? 'active' : 'warning'}>
                      {cat.status}
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

      {activeTab === 'employees' && (
        <div className="border border-border-subtle bg-white shadow-custom">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Employee
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Email
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
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{emp.name}</td>
                  <td className="px-5 py-4 text-sm text-foreground/60">{emp.email}</td>
                  <td className="px-5 py-4">
                    <StatusPill variant={emp.role === 'ADMIN' ? 'active' : 'outlined'}>
                      {emp.role.replace(/_/g, ' ')}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {emp.department?.name ?? '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill variant={emp.status === 'ACTIVE' ? 'active' : 'warning'}>
                      {emp.status}
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

      <p className="text-xs text-foreground/40">
        Editing a department here also drives the pilllist in Assets & Allocation
      </p>
    </div>
  )
}
