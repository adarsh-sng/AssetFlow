import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'

type NotificationFilter = 'ALL' | 'ALERTS' | 'APPROVALS' | 'BOOKINGS'

type ApiNotificationType =
  | 'ASSET'
  | 'BOOKING'
  | 'MAINTENANCE'
  | 'TRANSFER'
  | 'AUDIT'
  | 'OVERDUE'
  | 'SYSTEM'

interface ApiNotification {
  id: string
  title: string
  message: string
  type: ApiNotificationType
  createdAt: string
  readAt: string | null
}

interface Notification {
  id: string
  message: string
  timestamp: string
  type: Lowercase<ApiNotificationType>
  unread: boolean
}

const filterTabs: { key: NotificationFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ALERTS', label: 'Alerts' },
  { key: 'APPROVALS', label: 'Approvals' },
  { key: 'BOOKINGS', label: 'Bookings' },
]

const typeColor: Record<string, string> = {
  asset: 'bg-foreground',
  maintenance: 'bg-accent',
  booking: 'bg-foreground',
  transfer: 'bg-accent',
  overdue: 'bg-orange-500',
  audit: 'bg-orange-500',
  system: 'bg-foreground/50',
}

function formatTimestamp(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL')

  const { data: apiNotifications = [] } = useQuery<ApiNotification[]>({
    queryKey: queryKeys.notifications.list({ filter: activeFilter }),
    queryFn: () => api.get<ApiNotification[]>('/notifications'),
    refetchInterval: 10000,
  })

  const notifications = useMemo<Notification[]>(
    () =>
      apiNotifications.map((notification) => ({
        id: notification.id,
        message: `${notification.title}: ${notification.message}`,
        timestamp: formatTimestamp(notification.createdAt),
        type: notification.type.toLowerCase() as Lowercase<ApiNotificationType>,
        unread: !notification.readAt,
      })),
    [apiNotifications]
  )

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'ALERTS') return n.type === 'overdue' || n.type === 'audit' || n.type === 'system'
    if (activeFilter === 'APPROVALS') return n.type === 'maintenance' || n.type === 'transfer'
    if (activeFilter === 'BOOKINGS') return n.type === 'booking'
    return true
  })

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
        {filteredNotifications.length === 0 && (
          <div className="px-5 py-8 text-sm text-foreground/40">No notifications found.</div>
        )}
        {filteredNotifications.map((n) => (
          <div key={n.id} className="flex items-center justify-between px-5 py-4 hover:bg-background transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <span className={`block size-2 flex-shrink-0 ${typeColor[n.type]}`} />
              <span className={`text-sm ${n.unread ? 'font-medium' : ''}`}>
                {n.message.split(/(AF-\d+)/).map((part, i) =>
                  part.match(/AF-\d+/) ? (
                    <strong key={i} className="font-bold">{part}</strong>
                  ) : (
                    part
                  )
                )}
              </span>
            </div>
            <span className="flex-shrink-0 text-2xs font-bold uppercase tracking-widest text-foreground/40">
              {n.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
