import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, ArrowLeftRight, RotateCcw } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'

interface Allocation {
  id: string
  assetTag: string
  assetName: string
  allocatedTo: string
  targetType: 'EMPLOYEE' | 'DEPARTMENT'
  expectedReturnAt: string | null
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED'
  isOverdue: boolean
}

const mockAllocations: Allocation[] = [
  { id: '1', assetTag: 'AF-0114', assetName: 'Dell Laptop', allocatedTo: 'Priya Shah', targetType: 'EMPLOYEE', expectedReturnAt: '2026-07-15', status: 'ACTIVE', isOverdue: false },
  { id: '2', assetTag: 'AF-0062', assetName: 'Projector', allocatedTo: 'Engineering', targetType: 'DEPARTMENT', expectedReturnAt: null, status: 'ACTIVE', isOverdue: false },
  { id: '3', assetTag: 'AF-0201', assetName: 'Office Chair', allocatedTo: 'Raj Kumar', targetType: 'EMPLOYEE', expectedReturnAt: '2026-06-01', status: 'ACTIVE', isOverdue: true },
  { id: '4', assetTag: 'AF-0089', assetName: 'Keyboard', allocatedTo: 'Marketing', targetType: 'DEPARTMENT', expectedReturnAt: '2026-07-10', status: 'ACTIVE', isOverdue: false },
  { id: '5', assetTag: 'AF-0034', assetName: 'Monitor', allocatedTo: 'Anita Desai', targetType: 'EMPLOYEE', expectedReturnAt: '2026-04-01', status: 'RETURNED', isOverdue: false },
  { id: '6', assetTag: 'AF-0178', assetName: 'Laptop', allocatedTo: 'Rohit Verma', targetType: 'EMPLOYEE', expectedReturnAt: '2026-07-01', status: 'TRANSFERRED', isOverdue: false },
]

const filters = ['Status', 'Type', 'Department']

export function AllocationPage() {
  const [search, setSearch] = useState('')

  const { data: allocations = mockAllocations } = useQuery<Allocation[]>({
    queryKey: queryKeys.allocations.list({ search }),
    queryFn: async () => {
      const res = await fetch(`/api/allocations?q=${search}`)
      if (!res.ok) return mockAllocations
      return res.json()
    },
    initialData: mockAllocations,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Allocation & Transfer</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-foreground bg-white px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
            <ArrowLeftRight size={14} />
            Transfer
          </button>
          <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
            <Plus size={14} />
            Allocate
          </button>
        </div>
      </div>

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
        {filters.map((f) => (
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
            {allocations.map((a) => (
              <tr key={a.id} className="hover:bg-background transition-colors cursor-pointer">
                <td className="px-5 py-4">
                  <span className="text-sm font-bold">{a.assetTag}</span>
                  <span className="ml-2 text-sm text-foreground/60">{a.assetName}</span>
                </td>
                <td className="px-5 py-4 text-sm">{a.allocatedTo}</td>
                <td className="px-5 py-4">
                  <StatusPill variant={a.targetType === 'EMPLOYEE' ? 'outlined' : 'active'}>
                    {a.targetType}
                  </StatusPill>
                </td>
                <td className={`px-5 py-4 text-sm ${a.isOverdue ? 'font-bold text-accent' : 'text-foreground/60'}`}>
                  {a.expectedReturnAt
                    ? new Date(a.expectedReturnAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-5 py-4">
                  <StatusPill
                    variant={
                      a.status === 'ACTIVE'
                        ? a.isOverdue ? 'warning' : 'active'
                        : a.status === 'TRANSFERRED' ? 'active' : 'outlined'
                    }
                  >
                    {a.isOverdue ? 'OVERDUE' : a.status}
                  </StatusPill>
                </td>
                <td className="px-5 py-4">
                  {a.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <button className="border border-border-subtle px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/60 hover:border-foreground hover:text-foreground transition-colors">
                        <RotateCcw size={11} />
                      </button>
                      <button className="border border-border-subtle px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/60 hover:border-foreground hover:text-foreground transition-colors">
                        <ArrowLeftRight size={11} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
