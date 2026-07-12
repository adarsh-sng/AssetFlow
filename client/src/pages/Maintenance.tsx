import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { ServerMaintenanceRequest } from '../lib/types'

type TicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'TECHNICIAN_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'

const columns: { key: TicketStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'TECHNICIAN_ASSIGNED', label: 'Technician assigned' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'RESOLVED', label: 'Resolved' },
]

const filters = ['Status', 'Asset', 'Technician']

export function MaintenancePage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ assetId: '', issue: '', priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' })
  const queryClient = useQueryClient()

  const { data: tickets = [], isLoading, error } = useQuery<ServerMaintenanceRequest[]>({
    queryKey: queryKeys.maintenance.list({ search }),
    queryFn: () => api.get<ServerMaintenanceRequest[]>('/maintenance'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => api.post('/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all })
      setShowCreate(false)
      setCreateForm({ assetId: '', issue: '', priority: 'MEDIUM' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}/reject`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}/start`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}/resolve`, { resolutionNote: '' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  })

  const getColumnTickets = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Maintenance</h1>
        <div className="grid grid-cols-5 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="space-y-3">
              <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">{col.label}</h3>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 bg-foreground/5 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Maintenance</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load maintenance data. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Maintenance</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors"
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? 'Cancel' : 'Raise Request'}
        </button>
      </div>

      {showCreate && (
        <div className="border border-border-subtle bg-white p-5 shadow-custom space-y-4">
          <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">New Maintenance Request</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Asset ID</label>
              <input
                type="text"
                value={createForm.assetId}
                onChange={(e) => setCreateForm({ ...createForm, assetId: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="Asset ID"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Priority</label>
              <div className="relative">
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as typeof createForm.priority })}
                  className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Issue</label>
              <input
                type="text"
                value={createForm.issue}
                onChange={(e) => setCreateForm({ ...createForm, issue: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="Describe the issue..."
              />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate(createForm)}
            disabled={!createForm.assetId || !createForm.issue || createMutation.isPending}
            className="bg-accent px-5 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-accent">Failed to create maintenance request.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3 border border-border-subtle bg-white px-4 py-3">
          <Search size={16} className="text-foreground/40" />
          <input
            type="text"
            placeholder="Search by asset tag, issue, or technician..."
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

      <div className="grid grid-cols-5 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="space-y-3">
            <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
              {col.label}
            </h3>
            <div className="space-y-3">
              {getColumnTickets(col.key).map((ticket) => (
                <div
                  key={ticket.id}
                  className={`border px-4 py-3 ${
                    ticket.status === 'RESOLVED'
                      ? 'border-accent/30 bg-accent/10'
                      : 'border-border-subtle bg-white'
                  }`}
                >
                  <div className="text-sm font-bold">{ticket.asset.tag}</div>
                  <div className="mt-1 text-sm text-foreground/70">{ticket.issue}</div>
                  {ticket.technician && (
                    <div className="mt-2 text-2xs text-foreground/50">
                      tech: {ticket.technician.name}
                    </div>
                  )}
                  {ticket.resolvedAt && (
                    <div className="mt-2 text-2xs text-accent">
                      resolved {new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {ticket.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(ticket.id)}
                          disabled={approveMutation.isPending}
                          className="border border-foreground px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(ticket.id)}
                          disabled={rejectMutation.isPending}
                          className="border border-border-subtle px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground/50 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {ticket.status === 'APPROVED' && (
                      <button
                        onClick={() => startMutation.mutate(ticket.id)}
                        disabled={startMutation.isPending}
                        className="border border-foreground px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => resolveMutation.mutate(ticket.id)}
                        disabled={resolveMutation.isPending}
                        className="border border-foreground px-2 py-1 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-foreground/40">
        Approving a card moves the asset to under maintenance, resolving returns it to available.
      </p>
    </div>
  )
}
