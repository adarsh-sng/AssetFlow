import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'

interface Resource {
  id: string
  name: string
  type: 'ROOM' | 'EQUIPMENT'
}

interface Booking {
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

const mockResources: Resource[] = [
  { id: 'r1', name: 'Conference Room B2', type: 'ROOM' },
  { id: 'r2', name: 'Conference Room A1', type: 'ROOM' },
  { id: 'r3', name: 'Meeting Room C3', type: 'ROOM' },
]

const mockBookings: Booking[] = [
  { id: 'b1', resourceId: 'r1', resourceName: 'Conference Room B2', bookedBy: 'Procurement Team', department: 'Procurement', date: '2026-07-07', startTime: '09:00', endTime: '10:00', status: 'UPCOMING' },
  { id: 'b2', resourceId: 'r1', resourceName: 'Conference Room B2', bookedBy: 'Raj Kumar', department: 'Marketing', date: '2026-07-07', startTime: '11:00', endTime: '12:00', status: 'UPCOMING' },
  { id: 'b3', resourceId: 'r2', resourceName: 'Conference Room A1', bookedBy: 'Priya Shah', department: 'Engineering', date: '2026-07-07', startTime: '14:00', endTime: '15:30', status: 'UPCOMING' },
  { id: 'b4', resourceId: 'r1', resourceName: 'Conference Room B2', bookedBy: 'Anita Desai', department: 'HR', date: '2026-07-05', startTime: '10:00', endTime: '11:00', status: 'COMPLETED' },
]

const timeSlots = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00']

const filters = ['Status', 'Resource', 'Department']

export function BookingPage() {
  const [search, setSearch] = useState('')
  const [selectedResource, setSelectedResource] = useState('r1')
  const [selectedDate, setSelectedDate] = useState('2026-07-07')

  const { data: bookings = mockBookings } = useQuery<Booking[]>({
    queryKey: queryKeys.bookings.list({ search, resource: selectedResource, date: selectedDate }),
    queryFn: async () => {
      const res = await fetch(`/api/bookings?q=${search}&resource=${selectedResource}&date=${selectedDate}`)
      if (!res.ok) return mockBookings
      return res.json()
    },
    initialData: mockBookings,
  })

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

  const selectedResourceName = mockResources.find((r) => r.id === selectedResource)?.name || ''

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
              {mockResources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
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
