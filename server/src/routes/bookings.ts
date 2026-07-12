import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, badRequest, conflict, created, notFound, ok } from '../lib/http.ts'
import { logActivity, notify } from '../lib/events.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

const bookingSchema = z
  .object({
    assetId: z.string(),
    title: z.string().trim().min(2),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    location: z.string().optional(),
    notes: z.string().optional(),
    reminderAt: z.coerce.date().optional(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'Booking end time must be after start time',
    path: ['endsAt'],
  })

async function hasBookingConflict(assetId: string, startsAt: Date, endsAt: Date, excludeId?: string) {
  const conflictCount = await prisma.resourceBooking.count({
    where: {
      assetId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: 'CANCELLED' },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  })

  return conflictCount > 0
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const bookings = await prisma.resourceBooking.findMany({
      where: {
        assetId: req.query.assetId as string | undefined,
        status: req.query.status as never,
      },
      include: {
        asset: true,
        requestedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startsAt: 'asc' },
    })
    return ok(res, bookings)
  })
)

router.post(
  '/',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = bookingSchema.parse(req.body)
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } })

    if (!asset) {
      return notFound(res, 'Bookable resource not found')
    }

    if (!asset.isBookable) {
      return badRequest(res, 'This asset is not bookable')
    }

    if (await hasBookingConflict(input.assetId, input.startsAt, input.endsAt)) {
      return conflict(res, 'Resource is already booked for an overlapping time slot')
    }

    const booking = await prisma.resourceBooking.create({
      data: {
        ...input,
        requestedById: req.user?.id,
        status: input.startsAt <= new Date() && input.endsAt > new Date() ? 'ONGOING' : 'UPCOMING',
      },
      include: { asset: true },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'CONFIRMED_BOOKING',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Booked ${booking.asset.name} from ${booking.startsAt.toISOString()} to ${booking.endsAt.toISOString()}.`,
    })

    if (req.user?.id) {
      await notify({
        recipientId: req.user.id,
        type: 'BOOKING',
        title: 'Booking confirmed',
        message: `${booking.asset.name} is booked for your selected slot.`,
        entityType: 'BOOKING',
        entityId: booking.id,
      })
    }

    return created(res, booking)
  })
)

router.patch(
  '/:id',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = bookingSchema.partial().parse(req.body)
    const existing = await prisma.resourceBooking.findUnique({ where: { id: req.params.id as string } })

    if (!existing) {
      return notFound(res, 'Booking not found')
    }

    const startsAt = input.startsAt ?? existing.startsAt
    const endsAt = input.endsAt ?? existing.endsAt

    if (endsAt <= startsAt) {
      return badRequest(res, 'Booking end time must be after start time')
    }

    if (await hasBookingConflict(input.assetId ?? existing.assetId, startsAt, endsAt, existing.id)) {
      return conflict(res, 'Resource is already booked for an overlapping time slot')
    }

    const booking = await prisma.resourceBooking.update({
      where: { id: existing.id },
      data: input,
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'UPDATED_BOOKING',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Updated booking ${booking.title}.`,
    })

    return ok(res, booking)
  })
)

router.patch(
  '/:id/cancel',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const booking = await prisma.resourceBooking.update({
      where: { id: req.params.id as string },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'CANCELLED_BOOKING',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Cancelled booking ${booking.title}.`,
    })

    return ok(res, booking)
  })
)

export { router as bookingRoutes }
