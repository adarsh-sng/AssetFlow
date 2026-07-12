import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'

interface ApiResource {
  id: string
  tag: string
  name: string
}

interface ApiBooking {
  id: string
  assetId: string
  title: string
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  startsAt: string
  endsAt: string
  asset?: { name: string; tag: string } | null
  requestedBy?: {
    name: string
    department?: { name: string } | null
  } | null
}

interface BookingRow {
  id: string
  resourceId: string
  resourceName: string
  bookedBy: string
  department: string
  date: string
  startTime: string
  endTime: string
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
}

const timeSlots = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const filters = ['Status', 'Resource', 'Department']

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function BookingPage() {
  const [search, setSearch] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()))

  const { data: resources = [] } = useQuery<ApiResource[]>({
    queryKey: queryKeys.assets.list({ bookable: true }),
    queryFn: () => api.get<ApiResource[]>('/assets?bookable=true'),
    refetchInterval: 15000,
  })

  const { data: apiBookings = [] } = useQuery<ApiBooking[]>({
    queryKey: queryKeys.bookings.list({ search, selectedResource, selectedDate }),
    queryFn: () => api.get<ApiBooking[]>('/bookings'),
    refetchInterval: 10000,
  })

  useEffect(() => {
    if (!selectedResource && resources[0]) {
      setSelectedResource(resources[0].id)
    }
  }, [resources, selectedResource])

  const bookings = useMemo<BookingRow[]>(
    () =>
      apiBookings
        .map((booking) => ({
          id: booking.id,
          resourceId: booking.assetId,
          resourceName: booking.asset?.name ?? booking.title,
          bookedBy: booking.requestedBy?.name ?? 'Unknown requester',
          department: booking.requestedBy?.department?.name ?? '-',
          date: booking.startsAt.slice(0, 10),
          startTime: timeLabel(booking.startsAt),
          endTime: timeLabel(booking.endsAt),
          status: booking.status,
        }))
        .filter((booking) => {
          const haystack = [booking.resourceName, booking.bookedBy, booking.department, booking.status]
            .join(' ')
            .toLowerCase()
          return haystack.includes(search.toLowerCase())
        }),
    [apiBookings, search]
  )

  const filteredBookings = bookings.filter(
    (b) => b.resourceId === selectedResource && b.date === selectedDate
  )

  const getSlotBooking = (time: string) => {
    const [slotHour] = time.split(':').map(Number)
    return filteredBookings.find((b) => {
      const [startH] = b.startTime.split(':').map(Number)
      const [endH] = b.endTime.split(':').map(Number)
      return slotHour >= startH && slotHour < endH
    })
  }

  const selectedResourceName =
    resources.find((r) => r.id === selectedResource)?.name ?? 'No bookable resource'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Resource Booking</h1>
        <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
          <Plus size={14} />
          Book a slot
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3 border border-border-subtle bg-white px-4 py-3">
          <Search size={16} className="text-foreground/40" />
          <input
            type="text"
            placeholder="Search by resource or person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/30"
          />
        </div>
        <button className="flex items-center gap-2 border border-border-subtle bg-white px-4 py-3 text-sm text-foreground/60 hover:text-foreground transition-colors">
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            className="border border-border-subtle bg-white px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Resource</label>
          <div className="relative">
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
            >
              {resources.length === 0 && <option value="">No bookable resources</option>}
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.tag} - {r.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
      </div>

      <div className="border border-border-subtle bg-white shadow-custom">
        <div className="border-b border-border-subtle px-5 py-3">
          <span className="text-sm font-bold">{selectedResourceName}</span>
          <span className="ml-2 text-sm text-foreground/60">- {formatDate(selectedDate)}</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {timeSlots.map((time) => {
            const booking = getSlotBooking(time)
            return (
              <div key={time} className="flex items-center px-5 py-3">
                <span className="w-16 text-sm text-foreground/60">{time}</span>
                <div className="flex-1">
                  {booking ? (
                    <div className="border border-foreground/20 bg-foreground/5 px-4 py-2">
                      <span className="text-sm font-medium">Booked - {booking.bookedBy}</span>
                      <span className="ml-2 text-sm text-foreground/60">- {booking.startTime} to {booking.endTime}</span>
                    </div>
                  ) : (
                    <div className="border border-transparent px-4 py-2">
                      <span className="text-sm text-foreground/30">Available</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border border-border-subtle bg-white shadow-custom">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Resource</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Booked By</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Date</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Time</th>
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-sm text-foreground/40">
                  No bookings for this resource and date.
                </td>
              </tr>
            )}
            {filteredBookings.map((b) => (
              <tr key={b.id} className="hover:bg-background transition-colors cursor-pointer">
                <td className="px-5 py-4 text-sm font-medium">{b.resourceName}</td>
                <td className="px-5 py-4">
                  <span className="text-sm">{b.bookedBy}</span>
                  <span className="ml-2 text-xs text-foreground/40">{b.department}</span>
                </td>
                <td className="px-5 py-4 text-sm text-foreground/60">
                  {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-4 text-sm text-foreground/60">{b.startTime} - {b.endTime}</td>
                <td className="px-5 py-4">
                  <StatusPill variant={b.status === 'UPCOMING' ? 'active' : b.status === 'ONGOING' ? 'warning' : 'outlined'}>
                    {b.status}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
