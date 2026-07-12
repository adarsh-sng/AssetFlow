import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { UtilizationReport, MaintenanceFrequencyReport, AssetUsageReport } from '../lib/types'

export function ReportsPage() {
  const { data: utilization = [], isLoading: utilLoading, error: utilError } = useQuery<UtilizationReport[]>({
    queryKey: queryKeys.reports.utilization(),
    queryFn: () => api.get<UtilizationReport[]>('/reports/utilization'),
  })

  const { data: maintenanceFreq = [], isLoading: maintLoading, error: maintError } = useQuery<MaintenanceFrequencyReport[]>({
    queryKey: queryKeys.reports.maintenanceFrequency(),
    queryFn: () => api.get<MaintenanceFrequencyReport[]>('/reports/maintenance-frequency'),
  })

  const { data: assetUsage, isLoading: usageLoading, error: usageError } = useQuery<AssetUsageReport>({
    queryKey: queryKeys.reports.assetUsage(),
    queryFn: () => api.get<AssetUsageReport>('/reports/asset-usage'),
  })

  const isLoading = utilLoading || maintLoading || usageLoading
  const error = utilError || maintError || usageError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Reports & Analytics</h1>
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border-subtle bg-white p-5 shadow-custom">
              <div className="h-4 w-40 bg-foreground/10 animate-pulse mb-4" />
              <div className="h-40 bg-foreground/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Reports & Analytics</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load reports. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  const maxUtil = Math.max(...utilization.map((d) => d.activeAllocations), 1)
  const maxFreq = Math.max(...maintenanceFreq.map((d) => d.count), 1)

  const handleExport = () => {
    window.open('/api/reports/export.csv', '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Reports & Analytics</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 border border-foreground bg-white px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <Download size={14} />
          Export report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Utilization by department</h3>
          <div className="flex items-end gap-3 h-40">
            {utilization.map((d) => (
              <div key={d.departmentId} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-foreground"
                  style={{ height: `${(d.activeAllocations / maxUtil) * 100}%` }}
                />
                <span className="text-2xs text-foreground/50">{d.department}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Maintenance Frequency</h3>
          <div className="flex items-end gap-2 h-40">
            {maintenanceFreq.map((d) => (
              <div key={d.assetId} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-accent"
                  style={{ height: `${(d.count / maxFreq) * 100}%` }}
                />
                <span className="text-2xs text-foreground/50" title={d.name}>{d.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Most used assets</h3>
          <div className="space-y-3">
            {assetUsage?.mostUsed.map((item) => (
              <div key={item.asset?.id ?? item.asset?.tag} className="flex justify-between text-sm">
                <span className="font-medium">{item.asset?.name ?? 'Unknown'}</span>
                <span className="text-foreground/50">{item.count} bookings</span>
              </div>
            ))}
            {(!assetUsage?.mostUsed || assetUsage.mostUsed.length === 0) && (
              <p className="text-sm text-foreground/40">No booking data available</p>
            )}
          </div>
        </div>

        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Idle assets</h3>
          <div className="space-y-3">
            {assetUsage?.idle.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-foreground/50">unused 45+ days</span>
              </div>
            ))}
            {(!assetUsage?.idle || assetUsage.idle.length === 0) && (
              <p className="text-sm text-foreground/40">No idle assets found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
