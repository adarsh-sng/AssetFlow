import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { queryKeys } from '../lib/query-keys'

interface MostUsedAsset {
  name: string
  usage: string
}

interface IdleAsset {
  name: string
  idleDays: string
}

interface MaintenanceDue {
  name: string
  reason: string
}

const mockMostUsed: MostUsedAsset[] = [
  { name: 'Room B2', usage: '34 bookings this month' },
  { name: 'Van AF-343', usage: '21 trips this month' },
  { name: 'Projector AF-335', usage: '18 uses' },
]

const mockIdle: IdleAsset[] = [
  { name: 'Camera AF-0301', idleDays: 'unused 60+ days' },
  { name: 'Chair AF-0410', idleDays: 'unused 45 days' },
]

const mockMaintenanceDue: MaintenanceDue[] = [
  { name: 'Forklift AF-0087', reason: 'service due in 5 days' },
  { name: 'Laptop AF-0020', reason: '4 years old, nearing retirement' },
]

const utilizationData = [
  { dept: 'Eng', count: 42 },
  { dept: 'Mkt', count: 28 },
  { dept: 'HR', count: 15 },
  { dept: 'Fin', count: 32 },
  { dept: 'Ops', count: 38 },
]

const maintenanceFreqData = [12, 19, 8, 15, 22, 18, 25]

export function ReportsPage() {
  const { data: mostUsed = mockMostUsed } = useQuery<MostUsedAsset[]>({
    queryKey: queryKeys.reports.lists(),
    queryFn: async () => {
      const res = await fetch('/api/reports/most-used')
      if (!res.ok) return mockMostUsed
      return res.json()
    },
    initialData: mockMostUsed,
  })

  const maxUtil = Math.max(...utilizationData.map((d) => d.count))
  const maxFreq = Math.max(...maintenanceFreqData)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Reports & Analytics</h1>
        <button className="flex items-center gap-2 border border-foreground bg-white px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
          <Download size={14} />
          Export report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Utilization by department</h3>
          <div className="flex items-end gap-3 h-40">
            {utilizationData.map((d) => (
              <div key={d.dept} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-foreground"
                  style={{ height: `${(d.count / maxUtil) * 100}%` }}
                />
                <span className="text-2xs text-foreground/50">{d.dept}</span>
              </div>
            ))}
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
                <span className="text-2xs text-foreground/50">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Most used assets</h3>
          <div className="space-y-3">
            {mostUsed.map((item) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-foreground/50">{item.usage}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border-subtle bg-white p-5 shadow-custom">
          <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Idle assets</h3>
          <div className="space-y-3">
            {mockIdle.map((item) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-foreground/50">{item.idleDays}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border-subtle bg-white p-5 shadow-custom">
        <h3 className="mb-4 text-2xs font-bold uppercase tracking-widest text-foreground/50">Assets due for maintenance / nearing retirement</h3>
        <div className="space-y-3">
          {mockMaintenanceDue.map((item) => (
            <div key={item.name} className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-foreground/50">{item.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
