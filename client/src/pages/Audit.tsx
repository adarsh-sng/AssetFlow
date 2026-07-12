import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, AlertTriangle, ChevronDown, X } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { ServerAuditCycle, ServerAuditCycleDetail } from '../lib/types'

const filters = ['Status', 'Location', 'Department']

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    scope: '',
    startsAt: '',
    endsAt: '',
    location: '',
  })
  const queryClient = useQueryClient()

  const { data: cycles = [], isLoading, error } = useQuery<ServerAuditCycle[]>({
    queryKey: queryKeys.audits.lists(),
    queryFn: () => api.get<ServerAuditCycle[]>('/audits'),
  })

  const { data: selectedCycle } = useQuery<ServerAuditCycleDetail>({
    queryKey: queryKeys.audits.detail(selectedCycleId ?? ''),
    queryFn: () => api.get<ServerAuditCycleDetail>(`/audits/${selectedCycleId}`),
    enabled: !!selectedCycleId,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => {
      const payload = {
        ...data,
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
      }
      return api.post('/audits', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audits.all })
      setShowCreate(false)
      setCreateForm({ name: '', scope: '', startsAt: '', endsAt: '', location: '' })
    },
  })

  const verifyItemMutation = useMutation({
    mutationFn: ({ auditId, itemId, status }: { auditId: string; itemId: string; status: string }) =>
      api.patch(`/audits/${auditId}/items/${itemId}`, { status }),
    onSuccess: () => {
      if (selectedCycleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.audits.detail(selectedCycleId) })
      }
    },
  })

  const closeMutation = useMutation({
    mutationFn: (auditId: string) => api.post(`/audits/${auditId}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audits.all })
      setSelectedCycleId(null)
    },
  })

  const activeCycle = selectedCycle ?? cycles.find((c) => c.id === selectedCycleId)
  const items = selectedCycle?.items ?? []
  const flaggedCount = items.filter((i) => i.status !== 'VERIFIED' && i.status !== 'PENDING').length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Audit</h1>
        <div className="border border-border-subtle bg-white p-8 shadow-custom">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-foreground/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Audit</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load audit data. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Audit</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors"
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? 'Cancel' : 'Start Audit'}
        </button>
      </div>

      {showCreate && (
        <div className="border border-border-subtle bg-white p-5 shadow-custom space-y-4">
          <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">New Audit Cycle</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="e.g. Q3 Audit"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Scope</label>
              <input
                type="text"
                value={createForm.scope}
                onChange={(e) => setCreateForm({ ...createForm, scope: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="e.g. Engineering"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Start Date</label>
              <input
                type="date"
                value={createForm.startsAt}
                onChange={(e) => setCreateForm({ ...createForm, startsAt: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">End Date</label>
              <input
                type="date"
                value={createForm.endsAt}
                onChange={(e) => setCreateForm({ ...createForm, endsAt: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Location</label>
              <input
                type="text"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate(createForm)}
            disabled={!createForm.name || !createForm.scope || !createForm.startsAt || !createForm.endsAt || createMutation.isPending}
            className="bg-accent px-5 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Audit'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-accent">Failed to create audit cycle.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3 border border-border-subtle bg-white px-4 py-3">
          <Search size={16} className="text-foreground/40" />
          <input
            type="text"
            placeholder="Search by asset tag or location..."
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
        {filters.map((f) => (
          <button
            key={f}
            className="border border-border-subtle bg-white px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
          >
            {f}
          </button>
        ))}
      </div>

      {!selectedCycleId ? (
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setSelectedCycleId(cycle.id)}
              className="w-full border border-border-subtle bg-white px-5 py-4 text-left shadow-custom hover:shadow-hard transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold">{cycle.name}</span>
                  <span className="ml-2 text-sm text-foreground/60">
                    {cycle.department?.name ?? cycle.scope} - {cycle.location ?? 'All locations'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill variant={cycle.status === 'ACTIVE' ? 'active' : cycle.status === 'CLOSED' ? 'outlined' : 'warning'}>
                    {cycle.status}
                  </StatusPill>
                  <span className="text-2xs text-foreground/40">{cycle._count.items} items</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-foreground/50">
                {new Date(cycle.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(cycle.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {cycle.assignments.length > 0 && (
                  <> | Auditors: {cycle.assignments.map((a) => a.auditor.name).join(', ')}</>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border border-border-subtle bg-background px-5 py-4">
            <div>
              <button onClick={() => setSelectedCycleId(null)} className="text-sm text-foreground/50 hover:text-foreground mb-1">
                &larr; Back to cycles
              </button>
              <div className="text-sm font-bold">{activeCycle?.name}: {activeCycle?.department?.name ?? activeCycle?.scope}</div>
              <div className="text-xs text-foreground/50">
                {activeCycle && `${new Date(activeCycle.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(activeCycle.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                {activeCycle?.assignments && activeCycle.assignments.length > 0 && (
                  <> | Auditors: {activeCycle.assignments.map((a) => a.auditor.name).join(', ')}</>
                )}
              </div>
            </div>
            {activeCycle?.status === 'ACTIVE' && (
              <button
                onClick={() => closeMutation.mutate(activeCycle.id)}
                disabled={closeMutation.isPending}
                className="border border-foreground px-4 py-2 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Closing...' : 'Close audit cycle'}
              </button>
            )}
          </div>

          <div className="border border-border-subtle bg-white shadow-custom">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Asset</th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Expected Location</th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Verification</th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-background transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold">{item.asset.tag}</span>
                      <span className="ml-2 text-sm text-foreground/60">{item.asset.name}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground/60">{item.expectedLocation ?? '—'}</td>
                    <td className="px-5 py-4">
                      <StatusPill
                        variant={
                          item.status === 'VERIFIED'
                            ? 'active'
                            : item.status === 'MISSING'
                            ? 'warning'
                            : item.status === 'DAMAGED'
                            ? 'warning'
                            : 'outlined'
                        }
                      >
                        {item.status}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-4">
                      {item.status === 'PENDING' && activeCycle?.status === 'ACTIVE' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => verifyItemMutation.mutate({ auditId: activeCycle.id, itemId: item.id, status: 'VERIFIED' })}
                            disabled={verifyItemMutation.isPending}
                            className="border border-foreground px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => verifyItemMutation.mutate({ auditId: activeCycle.id, itemId: item.id, status: 'MISSING' })}
                            disabled={verifyItemMutation.isPending}
                            className="border border-border-subtle px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground/50 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                          >
                            Missing
                          </button>
                          <button
                            onClick={() => verifyItemMutation.mutate({ auditId: activeCycle.id, itemId: item.id, status: 'DAMAGED' })}
                            disabled={verifyItemMutation.isPending}
                            className="border border-border-subtle px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground/50 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                          >
                            Damaged
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {flaggedCount > 0 && (
            <div className="flex items-center justify-between border border-accent/30 bg-accent/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-accent" />
                <span className="text-sm font-medium">
                  {flaggedCount} assets flagged - discrepancy report generated automatically
                </span>
              </div>
              {activeCycle?.status === 'ACTIVE' && (
                <button
                  onClick={() => closeMutation.mutate(activeCycle.id)}
                  disabled={closeMutation.isPending}
                  className="border border-foreground px-4 py-2 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  Close audit cycle
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
