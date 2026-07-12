import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { ServerAsset, AssetStatus } from '../lib/types'

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
  const [showCreate, setShowCreate] = useState(false)
  const [newAsset, setNewAsset] = useState({ name: '', categoryId: '', serialNumber: '', condition: '', location: '' })
  const queryClient = useQueryClient()

  const { data: assets = [], isLoading, error } = useQuery<ServerAsset[]>({
    queryKey: queryKeys.assets.list({ search }),
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      return api.get<ServerAsset[]>(`/assets?${params.toString()}`)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof newAsset) => api.post<ServerAsset>('/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      setShowCreate(false)
      setNewAsset({ name: '', categoryId: '', serialNumber: '', condition: '', location: '' })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Assets</h1>
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
        <h1 className="font-serif text-4xl font-light">Assets</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load assets. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Assets</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors"
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? 'Cancel' : 'Register Asset'}
        </button>
      </div>

      {showCreate && (
        <div className="border border-border-subtle bg-white p-5 shadow-custom space-y-4">
          <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">New Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Name</label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="e.g. Dell Laptop"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Category ID</label>
              <input
                type="text"
                value={newAsset.categoryId}
                onChange={(e) => setNewAsset({ ...newAsset, categoryId: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="Category ID"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Serial Number</label>
              <input
                type="text"
                value={newAsset.serialNumber}
                onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Location</label>
              <input
                type="text"
                value={newAsset.location}
                onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate(newAsset)}
            disabled={!newAsset.name || !newAsset.categoryId || createMutation.isPending}
            className="bg-accent px-5 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Asset'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-accent">Failed to create asset. Please try again.</p>
          )}
        </div>
      )}

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
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-background transition-colors cursor-pointer">
                <td className="px-5 py-4 text-sm font-bold">{asset.tag}</td>
                <td className="px-5 py-4 text-sm">{asset.name}</td>
                <td className="px-5 py-4 text-sm text-foreground/60">{asset.category.name}</td>
                <td className="px-5 py-4">
                  <StatusPill variant={statusVariant(asset.status)}>
                    {asset.status.replace(/_/g, ' ')}
                  </StatusPill>
                </td>
                <td className="px-5 py-4 text-sm text-foreground/60">{asset.location ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
