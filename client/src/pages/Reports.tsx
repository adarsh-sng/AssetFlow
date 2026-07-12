import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { AssetStatus } from '../lib/types'

interface UtilizationRow {
  departmentId: string
  department: string
  assets: number
  activeAllocations: number
}

interface MaintenanceFrequencyRow {
  assetId: string
  tag?: string
  name?: string
  category?: string
  count: number
}

interface AssetUsageResponse {
  mostUsed: Array<{
    asset?: { id: string; tag: string; name: string } | null
    count: number
  }>
  idle: Array<{ id: string; tag: string; name: string }>
}

interface ApiAsset {
  id: string
  tag: string
  name: string
  status: AssetStatus
  warrantyExpiresAt: string | null
  retirementDueAt: string | null
}

interface MaintenanceDue {
  name: string
  reason: string
}

function shortLabel(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()
}

function daysUntil(iso: string) {
  const dayMs = 24 * 60 * 60 * 1000
  return Math.ceil((new Date(iso).getTime() - Date.now()) / dayMs)
}

export function ReportsPage() {
  const utilizationQuery = useQuery<UtilizationRow[]>({
    queryKey: [...queryKeys.reports.lists(), 'utilization'],
    queryFn: () => api.get<UtilizationRow[]>('/reports/utilization'),
    refetchInterval: 15000,
  })

  const maintenanceQuery = useQuery<MaintenanceFrequencyRow[]>({
    queryKey: [...queryKeys.reports.lists(), 'maintenance-frequency'],
    queryFn: () => api.get<MaintenanceFrequencyRow[]>('/reports/maintenance-frequency'),
    refetchInterval: 15000,
  })

  const assetUsageQuery = useQuery<AssetUsageResponse>({
    queryKey: [...queryKeys.reports.lists(), 'asset-usage'],
    queryFn: () => api.get<AssetUsageResponse>('/reports/asset-usage'),
    refetchInterval: 15000,
  })

  const assetsQuery = useQuery<ApiAsset[]>({
    queryKey: queryKeys.assets.list({ report: 'maintenance-due' }),
    queryFn: () => api.get<ApiAsset[]>('/assets'),
    refetchInterval: 15000,
  })

  const utilizationData = utilizationQuery.data ?? []
  const maintenanceFreqData = maintenanceQuery.data ?? []
  const mostUsed = assetUsageQuery.data?.mostUsed ?? []
  const idle = assetUsageQuery.data?.idle ?? []

  const maintenanceDue = useMemo<MaintenanceDue[]>(
    () =>
      (assetsQuery.data ?? [])
        .flatMap((asset) => {
          const items: MaintenanceDue[] = []
          if (asset.status === 'UNDER_MAINTENANCE') {
            items.push({ name: `${asset.name} ${asset.tag}`, reason: 'currently under maintenance' })
          }
          if (asset.retirementDueAt) {
            const days = daysUntil(asset.retirementDueAt)
            if (days <= 30) {
              items.push({
                name: `${asset.name} ${asset.tag}`,
                reason: days >= 0 ? `retirement due in ${days} days` : `retirement overdue by ${Math.abs(days)} days`,
              })
            }
          }
          if (asset.warrantyExpiresAt) {
            const days = daysUntil(asset.warrantyExpiresAt)
            if (days <= 30 && days >= 0) {
              items.push({ name: `${asset.name} ${asset.tag}`, reason: `warranty expires in ${days} days` })
            }
          }
          return items
        })
        .slice(0, 8),
    [assetsQuery.data]
  )

  const hasReportAccessError =
    utilizationQuery.isError || maintenanceQuery.isError || assetUsageQuery.isError
  const maxUtil = Math.max(1, ...utilizationData.map((d) => Math.max(d.assets, d.activeAllocations)))
  const maxFreq = Math.max(1, ...maintenanceFreqData.map((item) => item.count))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Reports & Analytics</h1>
        <a
          href="/api/reports/export.csv"
          className="flex items-center gap-2 border border-foreground bg-white px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <Download size={14} />
          Export report
        </a>
      </div>

      {hasReportAccessError && (
        <div className="border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-accent">
          Reports require an admin, asset manager, or department head account.
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Utilization by department</h3>
          <div className="flex items-end gap-3 h-40">
            {utilizationData.length === 0 && (
              <p className="self-center text-sm text-foreground/40">No utilization data.</p>
            )}
            {utilizationData.map((d) => (
              <div key={d.departmentId} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-foreground"
                  style={{ height: `${(d.activeAllocations / maxUtil) * 100}%` }}
                  title={`${d.activeAllocations} active allocations / ${d.assets} assets`}
                />
                <span className="text-2xs text-foreground/50">{shortLabel(d.department)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Maintenance Frequency</h3>
          <div className="flex items-end gap-2 h-40">
            {maintenanceFreqData.length === 0 && (
              <p className="self-center text-sm text-foreground/40">No maintenance history.</p>
            )}
            {maintenanceFreqData.map((item) => (
              <div key={item.assetId} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-accent"
                  style={{ height: `${(item.count / maxFreq) * 100}%` }}
                  title={`${item.tag ?? item.assetId}: ${item.count} requests`}
                />
                <span className="text-2xs text-foreground/50">{item.tag ?? 'Asset'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Most used assets</h3>
          <div className="space-y-3">
            {mostUsed.length === 0 && <p className="text-sm text-foreground/40">No usage data.</p>}
            {mostUsed.map((item) => (
              <div key={item.asset?.id ?? item.asset?.name ?? 'unknown'} className="flex justify-between text-sm">
                <span className="font-medium">
                  {item.asset ? `${item.asset.name} ${item.asset.tag}` : 'Unknown asset'}
                </span>
                <span className="text-foreground/50">{item.count} bookings</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Idle assets</h3>
          <div className="space-y-3">
            {idle.length === 0 && <p className="text-sm text-foreground/40">No idle assets.</p>}
            {idle.slice(0, 8).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-foreground/50">{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border-subtle bg-white p-5 shadow-custom">
        <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Assets due for maintenance / nearing retirement</h3>
        <div className="space-y-3">
          {maintenanceDue.length === 0 && <p className="text-sm text-foreground/40">No upcoming asset risk signals.</p>}
          {maintenanceDue.map((item) => (
            <div key={`${item.name}-${item.reason}`} className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-foreground/50">{item.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
