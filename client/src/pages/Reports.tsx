import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { queryKeys } from '../lib/query-keys'
import { fetchReports } from '../lib/services'

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.reports.lists(),
    queryFn: fetchReports,
  })

  const mostUsed = data?.mostUsed ?? []
  const idle = data?.idle ?? []
  const utilizationData = data?.utilizationData ?? []
  const maintenanceFreqData = data?.maintenanceFreqData ?? [0]
  const maintenanceDue = data?.maintenanceDue ?? []

  const maxUtil = Math.max(...utilizationData.map((d) => d.count), 1)
  const maxFreq = Math.max(...maintenanceFreqData, 1)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Reports & Analytics</h1>
        <button className="flex items-center gap-2 border border-foreground bg-white px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
          <Download size={14} />
          Export report
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/50">Loading reports...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-border-subtle bg-white p-5 shadow-custom">
              <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Utilization by department</h3>
              <div className="flex items-end gap-3 h-40">
                {utilizationData.length === 0 ? (
                  <p className="text-sm text-foreground/50">No allocation data.</p>
                ) : (
                  utilizationData.map((d) => (
                    <div key={d.dept} className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className="w-full bg-foreground"
                        style={{ height: `${(d.count / maxUtil) * 100}%` }}
                      />
                      <span className="text-2xs text-foreground/50">{d.dept}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-border-subtle bg-white p-5 shadow-custom">
              <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Maintenance Frequency</h3>
              <div className="flex items-end gap-2 h-40">
                {maintenanceFreqData.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-accent"
                      style={{ height: `${(val / maxFreq) * 100}%` }}
                    />
                    <span className="text-2xs text-foreground/50">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border border-border-subtle bg-white p-5 shadow-custom">
              <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Most used assets</h3>
              <div className="space-y-3">
                {mostUsed.length === 0 ? (
                  <p className="text-sm text-foreground/50">No booking data yet.</p>
                ) : (
                  mostUsed.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-foreground/50">{item.usage}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-border-subtle bg-white p-5 shadow-custom">
              <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Idle assets</h3>
              <div className="space-y-3">
                {idle.length === 0 ? (
                  <p className="text-sm text-foreground/50">No idle assets.</p>
                ) : (
                  idle.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-foreground/50">{item.idleDays}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border border-border-subtle bg-white p-5 shadow-custom">
            <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Assets due for maintenance / nearing retirement</h3>
            <div className="space-y-3">
              {maintenanceDue.length === 0 ? (
                <p className="text-sm text-foreground/50">No open maintenance requests.</p>
              ) : (
                maintenanceDue.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-foreground/50">{item.reason}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
