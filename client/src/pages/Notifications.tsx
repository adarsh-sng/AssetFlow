import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import { fetchNotifications } from '../lib/services'

type NotificationFilter = 'ALL' | 'ALERTS' | 'APPROVALS' | 'BOOKINGS'

const filterTabs: { key: NotificationFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ALERTS', label: 'Alerts' },
  { key: 'APPROVALS', label: 'Approvals' },
  { key: 'BOOKINGS', label: 'Bookings' },
]

const typeColor: Record<string, string> = {
  allocation: 'bg-foreground',
  maintenance: 'bg-accent',
  booking: 'bg-foreground',
  transfer: 'bg-accent',
  overdue: 'bg-orange-500',
  audit: 'bg-orange-500',
}

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL')

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications.list({ filter: activeFilter }),
    queryFn: fetchNotifications,
  })

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'ALERTS') return n.type === 'overdue' || n.type === 'audit'
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
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-foreground/50">Loading notifications...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="px-5 py-8 text-sm text-foreground/50">No notifications.</p>
        ) : (
          filteredNotifications.map((n) => (
            <div key={n.id} className="flex items-center justify-between px-5 py-4 hover:bg-background transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className={`block size-2 flex-shrink-0 ${typeColor[n.type] ?? 'bg-foreground'}`} />
                <span className="text-sm">
                  {n.message.split(/(AF-[A-Z0-9-]+)/).map((part, i) =>
                    part.match(/AF-[A-Z0-9-]+/) ? (
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
          ))
        )}
      </div>
    </div>
  )
}
