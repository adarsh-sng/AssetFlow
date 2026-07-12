import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Plus,
  SlidersHorizontal,
  ArrowLeftRight,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { AssetStatus } from '../lib/types'

interface ApiAsset {
  id: string
  tag: string
  name: string
  status: AssetStatus
}

interface ApiAllocation {
  id: string
  assetId: string
  targetType: 'EMPLOYEE' | 'DEPARTMENT'
  expectedReturnAt: string | null
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED'
  asset?: { tag: string; name: string } | null
  employee?: { name: string; email: string } | null
  department?: { name: string } | null
}

interface AssetOption {
  id: string
  tag: string
  name: string
  status: AssetStatus
  currentHolder?: string
  currentHolderDept?: string
}

interface AllocationRow {
  id: string
  assetTag: string
  assetName: string
  allocatedTo: string
  targetType: 'EMPLOYEE' | 'DEPARTMENT'
  expectedReturnAt: string | null
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED'
  isOverdue: boolean
}

const filters = ['Status', 'Type', 'Department']

export function AllocationPage() {
  const [search, setSearch] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')

  const { data: apiAssets = [] } = useQuery<ApiAsset[]>({
    queryKey: queryKeys.assets.list({ selector: 'allocation' }),
    queryFn: () => api.get<ApiAsset[]>('/assets'),
    refetchInterval: 10000,
  })

  const { data: apiAllocations = [] } = useQuery<ApiAllocation[]>({
    queryKey: queryKeys.allocations.list({ search }),
    queryFn: () => api.get<ApiAllocation[]>('/allocations'),
    refetchInterval: 10000,
  })

  const allocations = useMemo<AllocationRow[]>(
    () =>
      apiAllocations
        .map((allocation) => {
          const allocatedTo =
            allocation.targetType === 'EMPLOYEE'
              ? allocation.employee?.name ?? 'Unassigned employee'
              : allocation.department?.name ?? 'Unassigned department'

          return {
            id: allocation.id,
            assetTag: allocation.asset?.tag ?? '-',
            assetName: allocation.asset?.name ?? '-',
            allocatedTo,
            targetType: allocation.targetType,
            expectedReturnAt: allocation.expectedReturnAt,
            status: allocation.status,
            isOverdue:
              allocation.status === 'ACTIVE' &&
              !!allocation.expectedReturnAt &&
              new Date(allocation.expectedReturnAt).getTime() < Date.now(),
          }
        })
        .filter((allocation) => {
          const haystack = [
            allocation.assetTag,
            allocation.assetName,
            allocation.allocatedTo,
            allocation.status,
            allocation.targetType,
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(search.toLowerCase())
        }),
    [apiAllocations, search]
  )

  const assetOptions = useMemo<AssetOption[]>(
    () =>
      apiAssets.map((asset) => {
        const activeAllocation = apiAllocations.find(
          (allocation) => allocation.assetId === asset.id && allocation.status === 'ACTIVE'
        )
        return {
          id: asset.id,
          tag: asset.tag,
          name: asset.name,
          status: asset.status,
          currentHolder:
            activeAllocation?.employee?.name ?? activeAllocation?.department?.name,
          currentHolderDept: activeAllocation?.department?.name,
        }
      }),
    [apiAssets, apiAllocations]
  )

  const selectedAsset = assetOptions.find((a) => a.id === selectedAssetId)
  const hasConflict = selectedAsset?.status === 'ALLOCATED'

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

      <div>
        <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">
          Asset
        </label>
        <div className="relative">
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          >
            <option value="">Select Asset...</option>
            {assetOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.tag} - {a.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
        </div>
      </div>

      {hasConflict && (
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium text-accent">
                Already Allocated to {selectedAsset?.currentHolder ?? 'another holder'}
                {selectedAsset?.currentHolderDept ? ` (${selectedAsset.currentHolderDept})` : ''}
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                Direct re-allocation is blocked - submit a transfer request below
              </p>
              <button className="mt-3 border border-foreground px-4 py-2 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
                Transfer Request
              </button>
            </div>
          </div>
        </div>
      )}

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
            {allocations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-sm text-foreground/40">
                  No allocations found.
                </td>
              </tr>
            )}
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
                    : '-'}
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
