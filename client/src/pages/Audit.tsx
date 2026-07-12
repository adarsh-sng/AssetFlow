import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, AlertTriangle } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'

type VerificationStatus = 'VERIFIED' | 'MISSING' | 'DAMAGED'

interface AuditItem {
  id: string
  assetTag: string
  assetName: string
  expectedLocation: string
  verification: VerificationStatus
}

interface AuditCycle {
  id: string
  name: string
  department: string
  dateRange: string
  auditors: string[]
  status: 'IN_PROGRESS' | 'COMPLETED'
}

const mockAuditCycle: AuditCycle = {
  id: '1',
  name: 'Q3 audit',
  department: 'Engineering dept',
  dateRange: '1-15 Jul',
  auditors: ['A. Rao', 'S. Iqbal'],
  status: 'IN_PROGRESS',
}

const mockItems: AuditItem[] = [
  { id: '1', assetTag: 'AF-003', assetName: 'Dell Laptop', expectedLocation: 'Desk E12', verification: 'VERIFIED' },
  { id: '2', assetTag: 'AF-9921', assetName: 'Office Chair', expectedLocation: 'Desk E14', verification: 'MISSING' },
  { id: '3', assetTag: 'AF-9838', assetName: 'Monitor', expectedLocation: 'Desk E15', verification: 'DAMAGED' },
  { id: '4', assetTag: 'AF-0078', assetName: 'Keyboard', expectedLocation: 'Desk E11', verification: 'VERIFIED' },
  { id: '5', assetTag: 'AF-0112', assetName: 'Webcam', expectedLocation: 'Desk E13', verification: 'VERIFIED' },
]

const filters = ['Status', 'Location', 'Department']

export function AuditPage() {
  const [search, setSearch] = useState('')

  const { data: items = mockItems } = useQuery<AuditItem[]>({
    queryKey: queryKeys.audits.list({ search }),
    queryFn: async () => {
      const res = await fetch(`/api/audits?q=${search}`)
      if (!res.ok) return mockItems
      return res.json()
    },
    initialData: mockItems,
  })

  const flaggedCount = items.filter((i) => i.verification !== 'VERIFIED').length

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

      <div className="border border-border-subtle bg-background px-5 py-4">
        <div className="text-sm font-bold">{mockAuditCycle.name}: {mockAuditCycle.department} - {mockAuditCycle.dateRange}</div>
        <div className="mt-1 text-xs text-foreground/50">Auditors: {mockAuditCycle.auditors.join(', ')}</div>
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
