import { Router } from 'express'
import { asyncRoute, ok } from '../lib/http.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

router.get(
  '/stats',
  asyncRoute(async (req, res) => {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const [
      available,
      allocated,
      inRepair,
      bookings,
      pending,
      returns,
      overdue,
    ] = await Promise.all([
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'ALLOCATED' } }),
      prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
      prisma.resourceBooking.count({
        where: {
          status: { in: ['UPCOMING', 'ONGOING'] },
          startsAt: { lte: endOfDay },
          endsAt: { gte: startOfDay },
        },
      }),
      prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
      prisma.assetAllocation.count({
        where: {
          status: 'ACTIVE',
          expectedReturnAt: { gte: now },
        },
      }),
      prisma.assetAllocation.count({
        where: {
          status: 'ACTIVE',
          expectedReturnAt: { lt: now },
        },
      }),
    ])

    return ok(res, {
      available,
      allocated,
      inRepair,
      bookings,
      pending,
      returns,
      overdue,
    })
  })
)

router.get(
  '/activity',
  asyncRoute(async (req, res) => {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        actor: {
          select: { name: true },
        },
      },
    })

    return ok(
      res,
      logs.map((log) => ({
        id: log.id,
        message: log.description,
        timestamp: log.createdAt.toISOString(),
        actor: log.actor?.name ?? 'System',
        type: log.entityType.toLowerCase(),
      }))
    )
  })
)

router.get(
  '/summary',
  asyncRoute(async (req, res) => {
    const [stats, recentActivity] = await Promise.all([
      prisma.asset.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return ok(res, { stats, recentActivity })
  })
)

export { router as dashboardRoutes }
