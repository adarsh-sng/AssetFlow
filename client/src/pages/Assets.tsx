import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { AssetStatus } from '../lib/types'

interface ApiAsset {
  id: string
  tag: string
  name: string
  status: AssetStatus
  location: string | null
  category?: { name: string } | null
}

interface AssetRow {
  id: string
  tag: string
  name: string
  category: string
  status: AssetStatus
  location: string
}

const filters = ['Category', 'Status', 'Department']

function statusVariant(status: AssetStatus) {
  switch (status) {
    case 'AVAILABLE':
      return 'outlined'
    case 'ALLOCATED':
    case 'RESERVED':
      return 'active'
    default:
      return 'warning'
  }
}

export function AssetsPage() {
  const [search, setSearch] = useState('')

  const { data: apiAssets = [] } = useQuery<ApiAsset[]>({
    queryKey: queryKeys.assets.list({ search }),
    queryFn: () => api.get<ApiAsset[]>(`/assets?q=${encodeURIComponent(search)}`),
    refetchInterval: 10000,
  })

  const assets = useMemo<AssetRow[]>(
    () =>
      apiAssets.map((asset) => ({
        id: asset.id,
        tag: asset.tag,
        name: asset.name,
        category: asset.category?.name ?? 'Uncategorized',
        status: asset.status,
        location: asset.location ?? '-',
      })),
    [apiAssets]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Assets</h1>
        <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
          <Plus size={14} />
          Register Asset
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3 border border-border-subtle bg-white px-4 py-3">
          <Search size={16} className="text-foreground/40" />
          <input
            type="text"
            placeholder="Search by tag, serial, or QR code..."
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
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                Tag
              </th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                Name
              </th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                Category
              </th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                Status
              </th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                Location
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-sm text-foreground/40">
                  No assets found.
                </td>
              </tr>
            )}
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-background transition-colors cursor-pointer">
                <td className="px-5 py-4 text-sm font-bold">{asset.tag}</td>
                <td className="px-5 py-4 text-sm">{asset.name}</td>
                <td className="px-5 py-4 text-sm text-foreground/60">{asset.category}</td>
                <td className="px-5 py-4">
                  <StatusPill variant={statusVariant(asset.status)}>
                    {asset.status.replace(/_/g, ' ')}
                  </StatusPill>
                </td>
                <td className="px-5 py-4 text-sm text-foreground/60">{asset.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
