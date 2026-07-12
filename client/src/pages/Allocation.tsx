import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, ArrowLeftRight, RotateCcw, AlertTriangle, ChevronDown, X } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { ServerAllocation, ServerTransfer, ServerAsset, AssetStatus } from '../lib/types'

function isOverdue(expectedReturnAt: string | null): boolean {
  if (!expectedReturnAt) return false
  return new Date(expectedReturnAt) < new Date()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AllocationPage() {
  const [search, setSearch] = useState('')
  const [showAllocate, setShowAllocate] = useState(false)
  const [allocateForm, setAllocateForm] = useState({
    assetId: '',
    targetType: 'EMPLOYEE' as 'EMPLOYEE' | 'DEPARTMENT',
    employeeId: '',
    departmentId: '',
    expectedReturnAt: '',
  })
  const queryClient = useQueryClient()

  const { data: allocations = [], isLoading, error } = useQuery<ServerAllocation[]>({
    queryKey: queryKeys.allocations.list({ search }),
    queryFn: () => api.get<ServerAllocation[]>('/allocations'),
  })

  const { data: availableAssets = [] } = useQuery<ServerAsset[]>({
    queryKey: queryKeys.assets.list({ status: 'AVAILABLE' }),
    queryFn: () => api.get<ServerAsset[]>('/assets?status=AVAILABLE'),
  })

  const { data: transfers = [] } = useQuery<ServerTransfer[]>({
    queryKey: queryKeys.transfers.lists(),
    queryFn: () => api.get<ServerTransfer[]>('/allocations/transfers'),
  })

  const allocateMutation = useMutation({
    mutationFn: (data: typeof allocateForm) => {
      const payload: Record<string, unknown> = {
        assetId: data.assetId,
        targetType: data.targetType,
      }
      if (data.targetType === 'EMPLOYEE' && data.employeeId) payload.employeeId = data.employeeId
      if (data.targetType === 'DEPARTMENT' && data.departmentId) payload.departmentId = data.departmentId
      if (data.expectedReturnAt) payload.expectedReturnAt = data.expectedReturnAt
      return api.post('/allocations', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      setShowAllocate(false)
      setAllocateForm({ assetId: '', targetType: 'EMPLOYEE', employeeId: '', departmentId: '', expectedReturnAt: '' })
    },
  })

  const returnMutation = useMutation({
    mutationFn: (allocationId: string) => api.post(`/allocations/${allocationId}/return`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Allocation & Transfer</h1>
        <div className="border border-border-subtle bg-white p-8 shadow-custom">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
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
        <h1 className="font-serif text-4xl font-light">Allocation & Transfer</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load allocation data. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Allocation & Transfer</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-foreground bg-white px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
            <ArrowLeftRight size={14} />
            Transfer
          </button>
          <button
            onClick={() => setShowAllocate(!showAllocate)}
            className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors"
          >
            {showAllocate ? <X size={14} /> : <Plus size={14} />}
            {showAllocate ? 'Cancel' : 'Allocate'}
          </button>
        </div>
      </div>

      {showAllocate && (
        <div className="border border-border-subtle bg-white p-5 shadow-custom space-y-4">
          <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">Allocate Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Asset</label>
              <div className="relative">
                <select
                  value={allocateForm.assetId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, assetId: e.target.value })}
                  className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                >
                  <option value="">Select Asset...</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Target Type</label>
              <div className="relative">
                <select
                  value={allocateForm.targetType}
                  onChange={(e) => setAllocateForm({ ...allocateForm, targetType: e.target.value as 'EMPLOYEE' | 'DEPARTMENT' })}
                  className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              </div>
            </div>
            {allocateForm.targetType === 'EMPLOYEE' && (
              <div>
                <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Employee ID</label>
                <input
                  type="text"
                  value={allocateForm.employeeId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, employeeId: e.target.value })}
                  className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                  placeholder="Employee ID"
                />
              </div>
            )}
            {allocateForm.targetType === 'DEPARTMENT' && (
              <div>
                <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Department ID</label>
                <input
                  type="text"
                  value={allocateForm.departmentId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, departmentId: e.target.value })}
                  className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                  placeholder="Department ID"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Expected Return</label>
              <input
                type="date"
                value={allocateForm.expectedReturnAt}
                onChange={(e) => setAllocateForm({ ...allocateForm, expectedReturnAt: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => allocateMutation.mutate(allocateForm)}
            disabled={!allocateForm.assetId || allocateMutation.isPending}
            className="bg-accent px-5 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {allocateMutation.isPending ? 'Allocating...' : 'Allocate'}
          </button>
          {allocateMutation.isError && (
            <p className="text-sm text-accent">Failed to allocate asset. The asset may already be allocated.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3 border border-border-subtle bg-white px-4 py-3">
          <Search size={16} className="text-foreground/40" />
          <input
            type="text"
            placeholder="Search by asset tag, name, or person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/30"
          />
        </div>
        <button className="flex items-center gap-2 border border-border-subtle bg-white px-4 py-3 text-sm text-foreground/60 hover:text-foreground transition-colors">
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      <div className="flex gap-2">
        {['Status', 'Type', 'Department'].map((f) => (
          <button
            key={f}
            className="border border-border-subtle bg-white px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="border border-border-subtle bg-white shadow-custom">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Asset</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Allocated To</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Type</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Expected Return</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Status</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => {
              const overdue = isOverdue(a.expectedReturnAt)
              const holder = a.employee?.name ?? a.department?.name ?? '—'
              return (
                <tr key={a.id} className="hover:bg-background transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold">{a.asset.tag}</span>
                    <span className="ml-2 text-sm text-foreground/60">{a.asset.name}</span>
                  </td>
                  <td className="px-5 py-4 text-sm">{holder}</td>
                  <td className="px-5 py-4">
                    <StatusPill variant={a.targetType === 'EMPLOYEE' ? 'outlined' : 'active'}>
                      {a.targetType}
                    </StatusPill>
                  </td>
                  <td className={`px-5 py-4 text-sm ${overdue ? 'font-bold text-accent' : 'text-foreground/60'}`}>
                    {a.expectedReturnAt ? formatDate(a.expectedReturnAt) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill
                      variant={
                        a.status === 'ACTIVE'
                          ? overdue ? 'warning' : 'active'
                          : a.status === 'TRANSFERRED' ? 'active' : 'outlined'
                      }
                    >
                      {overdue ? 'OVERDUE' : a.status}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-4">
                    {a.status === 'ACTIVE' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => returnMutation.mutate(a.id)}
                          disabled={returnMutation.isPending}
                          className="border border-border-subtle px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/60 hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
                          title="Return"
                        >
                          <RotateCcw size={11} />
                        </button>
                        <button
                          className="border border-border-subtle px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
                          title="Transfer"
                        >
                          <ArrowLeftRight size={11} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
