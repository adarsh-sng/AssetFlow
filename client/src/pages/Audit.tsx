import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, AlertTriangle } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { fetchActiveAudit } from '../lib/services'

const filters = ['Status', 'Location', 'Department']

export function AuditPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.audits.list({ search }),
    queryFn: fetchActiveAudit,
  })

  const cycle = data?.cycle
  const items = (data?.items ?? []).filter((item) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.assetTag.toLowerCase().includes(q) ||
      item.assetName.toLowerCase().includes(q) ||
      item.expectedLocation.toLowerCase().includes(q)
    )
  })

  const flaggedCount = items.filter((i) => i.verification !== 'VERIFIED' && i.verification !== 'PENDING').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Audit</h1>
        <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
          <Plus size={14} />
          Start Audit
        </button>
      </div>

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

      {cycle ? (
        <div className="border border-border-subtle bg-background px-5 py-4">
          <div className="text-sm font-bold">{cycle.name}: {cycle.department} - {cycle.dateRange}</div>
          <div className="mt-1 text-xs text-foreground/50">Auditors: {cycle.auditors.join(', ')}</div>
        </div>
      ) : !isLoading ? (
        <div className="border border-border-subtle bg-background px-5 py-4 text-sm text-foreground/50">
          No active audit cycle.
        </div>
      ) : null}

      <div className="border border-border-subtle bg-white shadow-custom">
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-foreground/50">Loading audit items...</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-foreground/50">No audit items found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Asset</th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Expected Location</th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Verification</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-background transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold">{item.assetTag}</span>
                    <span className="ml-2 text-sm text-foreground/60">{item.assetName}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">{item.expectedLocation}</td>
                  <td className="px-5 py-4">
                    <StatusPill
                      variant={
                        item.verification === 'VERIFIED'
                          ? 'active'
                          : item.verification === 'MISSING'
                          ? 'warning'
                          : 'outlined'
                      }
                    >
                      {item.verification}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {flaggedCount > 0 && (
        <div className="flex items-center justify-between border border-accent/30 bg-accent/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-accent" />
            <span className="text-sm font-medium">
              {flaggedCount} assets flagged - discrepancy report generated automatically
            </span>
          </div>
          <button className="border border-foreground px-4 py-2 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
            Close audit cycle
          </button>
        </div>
      )}
    </div>
  )
}
