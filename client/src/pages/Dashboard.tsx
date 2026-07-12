import { useQuery } from '@tanstack/react-query'
import { Plus, CalendarDays, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { KPICard } from '../components/ui/KPICard'
import { AlertBanner } from '../components/ui/AlertBanner'
import { ActivityItem } from '../components/ui/ActivityItem'
import { queryKeys } from '../lib/query-keys'

const mockStats = {
  available: 128,
  allocated: 76,
  inRepair: 4,
  bookings: 9,
  pending: 3,
  returns: 12,
}

interface ActivityItem {
  id: string
  message: string
  timestamp: string
  type: 'allocation' | 'booking' | 'maintenance' | 'system'
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    message: 'Laptop AF-0114 allocated to Priya Shah',
    timestamp: '12 min ago',
    type: 'allocation',
  },
  {
    id: '2',
    message: 'Conference Room B2 booking confirmed for 2:00 PM',
    timestamp: '1 hr ago',
    type: 'booking',
  },
  {
    id: '3',
    message: 'Projector AF-0062 maintenance ticket resolved',
    timestamp: '3 hrs ago',
    type: 'maintenance',
  },
  {
    id: '4',
    message: 'Inventory sync complete (248 records updated)',
    timestamp: 'Yesterday',
    type: 'system',
  },
]

const today = new Date()
const dateStr = today.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).toUpperCase()

export function DashboardPage() {
  const navigate = useNavigate()

  const { data: stats = mockStats } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) return mockStats
      return res.json()
    },
    initialData: mockStats,
  })

  const { data: activity = mockActivity } = useQuery<ActivityItem[]>({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: async () => {
      const res = await fetch('/api/dashboard/activity')
      if (!res.ok) return mockActivity
      return res.json()
    },
    initialData: mockActivity,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">
            Today&apos;s Overview
          </h1>
          <p className="mt-1 text-2xs font-bold uppercase tracking-widest text-foreground/40">
            {dateStr}
          </p>
        </div>
        <button className="border border-foreground px-5 py-2.5 text-2xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
          Quick Report
        </button>
      </div>

      <AlertBanner
        message="3 assets overdue for return - flagged for immediate follow-up with respective department heads."
        action={{ label: 'Review List', onClick: () => navigate('/allocation') }}
      />

      <div className="grid grid-cols-6 gap-3">
        <KPICard label="Available" value={stats.available} />
        <KPICard label="Allocated" value={stats.allocated} />
        <KPICard label="In Repair" value={stats.inRepair} accent />
        <KPICard label="Bookings" value={stats.bookings} />
        <KPICard label="Pending" value={stats.pending} />
        <KPICard label="Returns" value={stats.returns} />
      </div>

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-2 space-y-4">
          <h2 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
            Primary Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/assets')}
              className="flex w-full items-center justify-between border border-border-subtle bg-white px-5 py-4 text-sm font-medium text-foreground shadow-custom hover:shadow-hard transition-shadow"
            >
              <span>Register Asset</span>
              <Plus size={16} className="text-accent" />
            </button>
            <button
              onClick={() => navigate('/booking')}
              className="flex w-full items-center justify-between border border-border-subtle bg-white px-5 py-4 text-sm font-medium text-foreground shadow-custom hover:shadow-hard transition-shadow"
            >
              <span>Book Resource</span>
              <CalendarDays size={16} className="text-accent" />
            </button>
            <button
              onClick={() => navigate('/maintenance')}
              className="flex w-full items-center justify-between border border-border-subtle bg-white px-5 py-4 text-sm font-medium text-foreground shadow-custom hover:shadow-hard transition-shadow"
            >
              <span>Raise Request</span>
              <MessageSquare size={16} className="text-accent" />
            </button>
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <h2 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
            Recent Activity
          </h2>
          <div className="border border-border-subtle bg-white p-5 shadow-custom">
            {activity.map((item) => (
              <ActivityItem
                key={item.id}
                message={item.message}
                timestamp={item.timestamp}
                highlight={item.type === 'allocation'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
