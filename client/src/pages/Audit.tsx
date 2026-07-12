import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, AlertTriangle, ChevronDown } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'

type VerificationStatus = 'PENDING' | 'VERIFIED' | 'MISSING' | 'DAMAGED'

interface ApiAuditCycle {
  id: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
  startsAt: string
  endsAt: string
  department?: { name: string } | null
  assignments?: Array<{ auditor?: { name: string } | null }>
}

interface ApiAuditDetail extends ApiAuditCycle {
  items: Array<{
    id: string
    expectedLocation: string | null
    status: VerificationStatus
    asset?: { tag: string; name: string } | null
  }>
}

interface AuditItem {
  id: string
  assetTag: string
  assetName: string
  expectedLocation: string
  verification: VerificationStatus
}

const filters = ['Status', 'Location', 'Department']

function dateRange(audit: ApiAuditCycle) {
  const start = new Date(audit.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  const end = new Date(audit.endsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  return `${start} - ${end}`
}

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [selectedAuditId, setSelectedAuditId] = useState('')

  const { data: audits = [] } = useQuery<ApiAuditCycle[]>({
    queryKey: queryKeys.audits.list({ view: 'cycles' }),
    queryFn: () => api.get<ApiAuditCycle[]>('/audits'),
    refetchInterval: 15000,
  })

  useEffect(() => {
    if (!selectedAuditId && audits[0]) {
      setSelectedAuditId(audits[0].id)
    }
  }, [audits, selectedAuditId])

  const { data: auditDetail } = useQuery<ApiAuditDetail>({
    queryKey: [...queryKeys.audits.list({ view: 'detail' }), selectedAuditId],
    queryFn: () => api.get<ApiAuditDetail>(`/audits/${selectedAuditId}`),
    enabled: selectedAuditId.length > 0,
    refetchInterval: 10000,
  })

  const selectedAudit = auditDetail ?? audits.find((audit) => audit.id === selectedAuditId)

  const items = useMemo<AuditItem[]>(
    () =>
      (auditDetail?.items ?? [])
        .map((item) => ({
          id: item.id,
          assetTag: item.asset?.tag ?? '-',
          assetName: item.asset?.name ?? '-',
          expectedLocation: item.expectedLocation ?? '-',
          verification: item.status,
        }))
        .filter((item) => {
          const haystack = [item.assetTag, item.assetName, item.expectedLocation, item.verification]
            .join(' ')
            .toLowerCase()
          return haystack.includes(search.toLowerCase())
        }),
    [auditDetail, search]
  )

  const flaggedCount = items.filter((i) => i.verification !== 'VERIFIED' && i.verification !== 'PENDING').length
  const auditors =
    selectedAudit?.assignments
      ?.map((assignment) => assignment.auditor?.name)
      .filter(Boolean)
      .join(', ') || '-'

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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Audit cycle</label>
          <div className="relative">
            <select
              value={selectedAuditId}
              onChange={(e) => setSelectedAuditId(e.target.value)}
              className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
            >
              {audits.length === 0 && <option value="">No audit cycles</option>}
              {audits.map((audit) => (
                <option key={audit.id} value={audit.id}>
                  {audit.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          </div>
        </div>
      </div>

      <div className="border border-border-subtle bg-background px-5 py-4">
        <div className="text-sm font-bold">
          {selectedAudit
            ? `${selectedAudit.name}: ${selectedAudit.department?.name ?? 'All departments'} - ${dateRange(selectedAudit)}`
            : 'No audit cycle selected'}
        </div>
        <div className="mt-1 text-xs text-foreground/50">Auditors: {auditors}</div>
      </div>

      <div className="border border-border-subtle bg-white shadow-custom">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Asset</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Expected Location</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Verification</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-sm text-foreground/40">
                  No audit items found.
                </td>
              </tr>
            )}
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
