import { Router } from 'express'
import { asyncRoute, ok } from '../lib/http.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, requireRole } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'))

router.get(
  '/utilization',
  asyncRoute(async (req, res) => {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            assets: true,
            allocations: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return ok(
      res,
      departments.map((department) => ({
        departmentId: department.id,
        department: department.name,
        assets: department._count.assets,
        activeAllocations: department._count.allocations,
      }))
    )
  })
)

router.get(
  '/maintenance-frequency',
  asyncRoute(async (req, res) => {
    const rows = await prisma.maintenanceRequest.groupBy({
      by: ['assetId'],
      _count: true,
      orderBy: { _count: { assetId: 'desc' } },
      take: 10,
    })

    const assets = await prisma.asset.findMany({
      where: { id: { in: rows.map((row) => row.assetId) } },
      select: { id: true, tag: true, name: true, category: { select: { name: true } } },
    })

    return ok(
      res,
      rows.map((row) => {
        const asset = assets.find((item) => item.id === row.assetId)
        return {
          assetId: row.assetId,
          tag: asset?.tag,
          name: asset?.name,
          category: asset?.category.name,
          count: row._count,
        }
      })
    )
  })
)

router.get(
  '/asset-usage',
  asyncRoute(async (req, res) => {
    const mostUsed = await prisma.resourceBooking.groupBy({
      by: ['assetId'],
      _count: true,
      orderBy: { _count: { assetId: 'desc' } },
      take: 5,
    })

    const activeSince = new Date()
    activeSince.setDate(activeSince.getDate() - 45)

    const recentlyBookedIds = await prisma.resourceBooking.findMany({
      where: { createdAt: { gte: activeSince } },
      select: { assetId: true },
      distinct: ['assetId'],
    })

    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { id: { in: mostUsed.map((row) => row.assetId) } },
          { id: { notIn: recentlyBookedIds.map((row) => row.assetId) }, isBookable: true },
        ],
      },
      select: { id: true, tag: true, name: true },
    })

    return ok(res, {
      mostUsed: mostUsed.map((row) => ({
        asset: assets.find((asset) => asset.id === row.assetId),
        count: row._count,
      })),
      idle: assets.filter((asset) => !mostUsed.some((row) => row.assetId === asset.id)),
    })
  })
)

router.get(
  '/booking-heatmap',
  asyncRoute(async (req, res) => {
    const bookings = await prisma.resourceBooking.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { startsAt: true },
    })

    const heatmap = new Map<string, number>()
    for (const booking of bookings) {
      const day = booking.startsAt.toLocaleDateString('en-US', { weekday: 'short' })
      const hour = booking.startsAt.getHours()
      const key = `${day}-${hour}`
      heatmap.set(key, (heatmap.get(key) ?? 0) + 1)
    }

    return ok(
      res,
      Array.from(heatmap.entries()).map(([key, count]) => {
        const [day, hour] = key.split('-')
        return { day, hour: Number(hour), count }
      })
    )
  })
)

router.get(
  '/export.csv',
  asyncRoute(async (req, res) => {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        department: true,
      },
      orderBy: { tag: 'asc' },
    })

    const header = ['Tag', 'Name', 'Category', 'Status', 'Department', 'Location'].join(',')
    const rows = assets.map((asset) =>
      [
        asset.tag,
        asset.name,
        asset.category.name,
        asset.status,
        asset.department?.name ?? '',
        asset.location ?? '',
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',')
    )

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="assetflow-assets.csv"')
    return res.send([header, ...rows].join('\n'))
  })
)

export { router as reportRoutes }
