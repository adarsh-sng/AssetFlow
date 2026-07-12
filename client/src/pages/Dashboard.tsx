import { useQuery } from '@tanstack/react-query'
import { Plus, CalendarDays, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { KPICard } from '../components/ui/KPICard'
import { AlertBanner } from '../components/ui/AlertBanner'
import { ActivityItem } from '../components/ui/ActivityItem'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { ActivityLog, DashboardStats } from '../lib/types'

const emptyStats: DashboardStats = {
  available: 0,
  allocated: 0,
  inRepair: 0,
  bookings: 0,
  pending: 0,
  returns: 0,
  overdue: 0,
}

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const today = new Date()
const dateStr = today.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).toUpperCase()

export function DashboardPage() {
  const navigate = useNavigate()

  const { data: stats = emptyStats } = useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
    refetchInterval: 10000,
  })

  const { data: activity = [] } = useQuery<ActivityLog[]>({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => api.get<ActivityLog[]>('/dashboard/activity'),
    refetchInterval: 10000,
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

      {stats.overdue > 0 && (
        <AlertBanner
          message={`${stats.overdue} assets overdue for return - flagged for immediate follow-up with respective department heads.`}
          action={{ label: 'Review List', onClick: () => navigate('/allocation') }}
        />
      )}

      <div className="grid grid-cols-7 gap-3">
        <KPICard label="Available" value={stats.available} />
        <KPICard label="Allocated" value={stats.allocated} />
        <KPICard label="In Repair" value={stats.inRepair} accent />
        <KPICard label="Bookings" value={stats.bookings} />
        <KPICard label="Pending" value={stats.pending} />
        <KPICard label="Returns" value={stats.returns} />
        <KPICard label="Overdue" value={stats.overdue} accent />
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
            {activity.length === 0 && (
              <p className="text-sm text-foreground/40">No activity yet.</p>
            )}
            {activity.map((item) => (
              <ActivityItem
                key={item.id}
                message={item.message}
                timestamp={formatTimestamp(item.timestamp)}
                highlight={item.type === 'allocation'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
