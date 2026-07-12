import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { fetchBookableResources, fetchBookings } from '../lib/services'

const timeSlots = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00']

const filters = ['Status', 'Resource', 'Department']

export function BookingPage() {
  const [search, setSearch] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  const { data: resources = [] } = useQuery({
    queryKey: [...queryKeys.assets.lists(), 'bookable'],
    queryFn: fetchBookableResources,
  })

  useEffect(() => {
    if (!selectedResource && resources.length > 0) {
      setSelectedResource(resources[0].id)
    }
  }, [resources, selectedResource])

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: queryKeys.bookings.list({ search, resource: selectedResource, date: selectedDate }),
    queryFn: () => fetchBookings(search),
  })

  const filteredBookings = bookings.filter(
    (b) => b.resourceId === selectedResource && b.date === selectedDate
  )

  const getSlotBooking = (time: string) => {
    const slotHour = Number(time.split(':')[0])
    const normalizedSlot = time.startsWith('1:') && !time.startsWith('10:') && !time.startsWith('11:') && !time.startsWith('12:')
      ? slotHour + 12
      : slotHour

    return filteredBookings.find(
      (b) => normalizedSlot >= b.startHour && normalizedSlot < b.endHour
    )
  }

  const selectedResourceName = resources.find((r) => r.id === selectedResource)?.name || ''

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
              {resources.length === 0 ? (
                <option value="">No bookable resources</option>
              ) : (
                resources.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))
              )}
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
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-foreground/50">Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="px-5 py-8 text-sm text-foreground/50">No bookings for this date.</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}
