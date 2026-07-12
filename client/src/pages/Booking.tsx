import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { queryKeys } from '../lib/query-keys'
import { api } from '../lib/api'
import type { ServerBooking, ServerAsset } from '../lib/types'

const timeSlots = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00']

export function BookingPage() {
  const [search, setSearch] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showBook, setShowBook] = useState(false)
  const [bookForm, setBookForm] = useState({ assetId: '', title: '', startTime: '', endTime: '' })
  const queryClient = useQueryClient()

  const { data: bookableAssets = [] } = useQuery<ServerAsset[]>({
    queryKey: queryKeys.assets.list({ bookable: true }),
    queryFn: () => api.get<ServerAsset[]>('/assets?bookable=true'),
  })

  const { data: bookings = [], isLoading, error } = useQuery<ServerBooking[]>({
    queryKey: queryKeys.bookings.list({ search, resource: selectedResource, date: selectedDate }),
    queryFn: () => {
      const params = new URLSearchParams()
      if (selectedResource) params.set('assetId', selectedResource)
      return api.get<ServerBooking[]>(`/bookings?${params.toString()}`)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof bookForm) => {
      const startsAt = new Date(`${selectedDate}T${data.startTime}:00`).toISOString()
      const endsAt = new Date(`${selectedDate}T${data.endTime}:00`).toISOString()
      return api.post('/bookings', {
        assetId: data.assetId,
        title: data.title,
        startsAt,
        endsAt,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
      setShowBook(false)
      setBookForm({ assetId: '', title: '', startTime: '', endTime: '' })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => api.patch(`/bookings/${bookingId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })

  const filteredBookings = bookings.filter(
    (b) => (!selectedResource || b.assetId === selectedResource) && b.startsAt.startsWith(selectedDate)
  )

  const getSlotBooking = (time: string) => {
    const [slotHour] = time.split(':').map(Number)
    return filteredBookings.find((b) => {
      const startH = new Date(b.startsAt).getHours()
      const endH = new Date(b.endsAt).getHours()
      return slotHour >= startH && slotHour < endH
    })
  }

  const selectedResourceName = bookableAssets.find((r) => r.id === selectedResource)?.name || ''

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-light">Resource Booking</h1>
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
        <h1 className="font-serif text-4xl font-light">Resource Booking</h1>
        <div className="border border-accent/30 bg-accent/10 px-5 py-4">
          <p className="text-sm font-medium text-accent">
            Unable to load bookings. Please ensure the server is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Resource Booking</h1>
        <button
          onClick={() => setShowBook(!showBook)}
          className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors"
        >
          {showBook ? <X size={14} /> : <Plus size={14} />}
          {showBook ? 'Cancel' : 'Book a slot'}
        </button>
      </div>

      {showBook && (
        <div className="border border-border-subtle bg-white p-5 shadow-custom space-y-4">
          <h3 className="text-2xs font-bold uppercase tracking-widest text-foreground/50">New Booking</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Resource</label>
              <div className="relative">
                <select
                  value={bookForm.assetId}
                  onChange={(e) => setBookForm({ ...bookForm, assetId: e.target.value })}
                  className="w-full appearance-none border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                >
                  <option value="">Select Resource...</option>
                  {bookableAssets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Title</label>
              <input
                type="text"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
                placeholder="Meeting title"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">Start Time</label>
              <input
                type="time"
                value={bookForm.startTime}
                onChange={(e) => setBookForm({ ...bookForm, startTime: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-bold uppercase tracking-widest text-foreground/50">End Time</label>
              <input
                type="time"
                value={bookForm.endTime}
                onChange={(e) => setBookForm({ ...bookForm, endTime: e.target.value })}
                className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate(bookForm)}
            disabled={!bookForm.assetId || !bookForm.title || !bookForm.startTime || !bookForm.endTime || createMutation.isPending}
            className="bg-accent px-5 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Booking...' : 'Book'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-accent">Failed to create booking. The time slot may be conflicting.</p>
          )}
        </div>
      )}

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
        {['Status', 'Resource', 'Department'].map((f) => (
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
              <option value="">All Resources</option>
              {bookableAssets.map((r) => (
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
          <span className="text-sm font-bold">{selectedResourceName || 'All Resources'}</span>
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
                      <span className="text-sm font-medium">Booked - {booking.requestedBy?.name ?? 'Unknown'}</span>
                      <span className="ml-2 text-sm text-foreground/60">
                        - {new Date(booking.startsAt).getHours()}:00 to {new Date(booking.endsAt).getHours()}:00
                      </span>
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
              <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => (
              <tr key={b.id} className="hover:bg-background transition-colors cursor-pointer">
                <td className="px-5 py-4 text-sm font-medium">{b.asset.name}</td>
                <td className="px-5 py-4">
                  <span className="text-sm">{b.requestedBy?.name ?? '—'}</span>
                </td>
                <td className="px-5 py-4 text-sm text-foreground/60">
                  {new Date(b.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-4 text-sm text-foreground/60">
                  {new Date(b.startsAt).getHours()}:00 - {new Date(b.endsAt).getHours()}:00
                </td>
                <td className="px-5 py-4">
                  <StatusPill variant={b.status === 'UPCOMING' ? 'active' : b.status === 'ONGOING' ? 'warning' : b.status === 'CANCELLED' ? 'outlined' : 'outlined'}>
                    {b.status}
                  </StatusPill>
                </td>
                <td className="px-5 py-4">
                  {b.status === 'UPCOMING' && (
                    <button
                      onClick={() => cancelMutation.mutate(b.id)}
                      disabled={cancelMutation.isPending}
                      className="border border-border-subtle px-3 py-1.5 text-2xs font-bold uppercase tracking-widest text-foreground/60 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
