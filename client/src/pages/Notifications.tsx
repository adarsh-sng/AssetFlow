import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { ServerNotification } from '../lib/types'

type NotificationFilter = 'ALL' | 'ALERTS' | 'APPROVALS' | 'BOOKINGS'

const filterTabs: { key: NotificationFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ALERTS', label: 'Alerts' },
  { key: 'APPROVALS', label: 'Approvals' },
  { key: 'BOOKINGS', label: 'Bookings' },
]

const typeColor: Record<string, string> = {
  ASSET: 'bg-foreground',
  MAINTENANCE: 'bg-accent',
  BOOKING: 'bg-foreground',
  TRANSFER: 'bg-accent',
  OVERDUE: 'bg-orange-500',
  AUDIT: 'bg-orange-500',
  SYSTEM: 'bg-foreground/30',
}

const filterTypeMap: Record<NotificationFilter, string | null> = {
  ALL: null,
  ALERTS: 'OVERDUE',
  APPROVALS: 'MAINTENANCE',
  BOOKINGS: 'BOOKING',
}

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL')
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading, error } = useQuery<ServerNotification[]>({
    queryKey: queryKeys.notifications.list({ filter: activeFilter }),
    queryFn: () => {
      const params = new URLSearchParams()
      const type = filterTypeMap[activeFilter]
      if (type) params.set('type', type)
      return api.get<ServerNotification[]>(`/notifications?${params.toString()}`)
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Notifications</h1>
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
        <h1 className="font-serif text-4xl font-light">Notifications</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load notifications. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Notifications</h1>
      </div>

      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 text-2xs font-bold uppercase tracking-widest transition-colors ${
              activeFilter === tab.key
                ? 'border border-foreground bg-foreground text-background'
                : 'border border-border-subtle bg-white text-foreground/50 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border border-border-subtle bg-white shadow-custom divide-y divide-border-subtle">
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-foreground/40">
            No notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.readAt && markReadMutation.mutate(n.id)}
              className={`flex items-center justify-between px-5 py-4 hover:bg-background transition-colors cursor-pointer ${
                !n.readAt ? 'bg-foreground/[0.02]' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`block size-2 flex-shrink-0 ${typeColor[n.type] ?? 'bg-foreground/30'}`} />
                <div>
                  <span className="text-sm font-medium mr-2">{n.title}</span>
                  <span className="text-sm text-foreground/60">{n.message}</span>
                </div>
              </div>
              <span className="flex-shrink-0 text-2xs font-bold uppercase tracking-widest text-foreground/40">
                {formatTimestamp(n.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
