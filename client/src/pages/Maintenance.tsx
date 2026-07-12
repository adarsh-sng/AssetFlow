import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'

type TicketStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'TECHNICIAN_ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'

interface ApiMaintenanceTicket {
  id: string
  issue: string
  status: TicketStatus
  resolvedAt: string | null
  asset?: { tag: string; name: string } | null
  technician?: { name: string } | null
}

interface MaintenanceTicket {
  id: string
  assetTag: string
  assetName: string
  issue: string
  status: TicketStatus
  technician?: string
  resolvedDate?: string
}

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

  const { data: apiTickets = [] } = useQuery<ApiMaintenanceTicket[]>({
    queryKey: queryKeys.maintenance.list({ search }),
    queryFn: () => api.get<ApiMaintenanceTicket[]>('/maintenance'),
    refetchInterval: 10000,
  })

  const tickets = useMemo<MaintenanceTicket[]>(
    () =>
      apiTickets
        .map((ticket) => ({
          id: ticket.id,
          assetTag: ticket.asset?.tag ?? '-',
          assetName: ticket.asset?.name ?? '-',
          issue: ticket.issue,
          status: ticket.status,
          technician: ticket.technician?.name,
          resolvedDate: ticket.resolvedAt ?? undefined,
        }))
        .filter((ticket) => {
          const haystack = [ticket.assetTag, ticket.assetName, ticket.issue, ticket.technician, ticket.status]
            .join(' ')
            .toLowerCase()
          return haystack.includes(search.toLowerCase())
        }),
    [apiTickets, search]
  )

  const getColumnTickets = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Maintenance</h1>
        <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
          <Plus size={14} />
          Raise Request
        </button>
      </div>

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
        {columns.map((col) => {
          const columnTickets = getColumnTickets(col.key)
          return (
            <div key={col.key} className="space-y-3">
              <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
                {col.label}
              </h3>
              <div className="space-y-3">
                {columnTickets.length === 0 && (
                  <div className="border border-border-subtle bg-white px-4 py-3 text-sm text-foreground/35">
                    Empty
                  </div>
                )}
                {columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`border px-4 py-3 ${
                      ticket.status === 'RESOLVED'
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-border-subtle bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold">{ticket.assetTag}</div>
                    <div className="mt-1 text-sm text-foreground/70">{ticket.issue}</div>
                    <div className="mt-1 text-2xs text-foreground/40">{ticket.assetName}</div>
                    {ticket.technician && (
                      <div className="mt-2 text-2xs text-foreground/50">
                        tech: {ticket.technician}
                      </div>
                    )}
                    {ticket.resolvedDate && (
                      <div className="mt-2 text-2xs text-accent">
                        resolved {new Date(ticket.resolvedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-foreground/40">
        Approving a card moves the asset to under maintenance, resolving returns it to available.
      </p>
    </div>
  )
}
