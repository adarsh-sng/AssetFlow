import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

type NotificationFilter = 'ALL' | 'ALERTS' | 'APPROVALS' | 'BOOKINGS'

interface Notification {
  id: string
  message: string
  timestamp: string
  type: 'allocation' | 'maintenance' | 'booking' | 'transfer' | 'overdue' | 'audit'
}

const mockNotifications: Notification[] = [
  { id: '1', message: 'Laptop AF-0014 assigned to Priya Shah', timestamp: '2m ago', type: 'allocation' },
  { id: '2', message: 'Maintenance request AF-0055 approved', timestamp: '18m ago', type: 'maintenance' },
  { id: '3', message: 'Booking confirmed: Room B2: 2:00 to 3:00 PM', timestamp: '1h ago', type: 'booking' },
  { id: '4', message: 'Transfer approved: AF-0033 to facilities dept', timestamp: '3h ago', type: 'transfer' },
  { id: '5', message: 'Overdue return: AF-0021 was due 3 days ago', timestamp: '1d ago', type: 'overdue' },
  { id: '6', message: 'Audit discrepancy flagged: AF-0088 damaged', timestamp: '2d ago', type: 'audit' },
]

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

  const { data: notifications = mockNotifications } = useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list({ filter: activeFilter }),
    queryFn: async () => {
      const res = await fetch(`/api/notifications?filter=${activeFilter}`)
      if (!res.ok) return mockNotifications
      return res.json()
    },
    initialData: mockNotifications,
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
        {filteredNotifications.map((n) => (
          <div key={n.id} className="flex items-center justify-between px-5 py-4 hover:bg-background transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <span className={`block size-2 flex-shrink-0 ${typeColor[n.type]}`} />
              <span className="text-sm">
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
