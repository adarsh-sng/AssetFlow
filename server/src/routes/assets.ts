import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, created, notFound, ok } from '../lib/http.ts'
import { logActivity } from '../lib/events.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

const assetSchema = z.object({
  name: z.string().trim().min(2),
  categoryId: z.string(),
  serialNumber: z.string().trim().optional(),
  qrCode: z.string().trim().optional(),
  acquisitionDate: z.coerce.date().optional(),
  acquisitionCost: z.union([z.string(), z.number()]).optional(),
  condition: z.string().trim().optional(),
  location: z.string().trim().optional(),
  departmentId: z.string().nullable().optional(),
  isBookable: z.boolean().optional(),
  photoUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  warrantyExpiresAt: z.coerce.date().optional(),
  retirementDueAt: z.coerce.date().optional(),
})

const updateAssetSchema = assetSchema.partial().extend({
  status: z
    .enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'])
    .optional(),
})

async function nextAssetTag() {
  const count = await prisma.asset.count()
  return `AF-${String(count + 1).padStart(4, '0')}`
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const query = z
      .object({
        q: z.string().optional(),
        categoryId: z.string().optional(),
        status: z.string().optional(),
        departmentId: z.string().optional(),
        location: z.string().optional(),
        bookable: z.coerce.boolean().optional(),
      })
      .parse(req.query)

    const assets = await prisma.asset.findMany({
      where: {
        categoryId: query.categoryId,
        status: query.status as never,
        departmentId: query.departmentId,
        location: query.location ? { contains: query.location, mode: 'insensitive' } : undefined,
        isBookable: query.bookable,
        OR: query.q
          ? [
              { tag: { contains: query.q, mode: 'insensitive' } },
              { name: { contains: query.q, mode: 'insensitive' } },
              { serialNumber: { contains: query.q, mode: 'insensitive' } },
              { qrCode: { contains: query.q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        category: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(res, assets)
  })
)

router.post(
  '/',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = assetSchema.parse(req.body)
    const tag = await nextAssetTag()
    const asset = await prisma.asset.create({
      data: {
        ...input,
        tag,
        status: 'AVAILABLE',
        acquisitionCost: input.acquisitionCost?.toString(),
      },
      include: {
        category: true,
        department: { select: { id: true, name: true } },
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'REGISTERED_ASSET',
      entityType: 'ASSET',
      entityId: asset.id,
      description: `Registered asset ${asset.tag} ${asset.name}.`,
    })

    return created(res, asset)
  })
)

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id as string },
      include: {
        category: true,
        department: { select: { id: true, name: true } },
        allocations: {
          orderBy: { allocatedAt: 'desc' },
          include: {
            employee: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } },
          },
        },
        maintenanceRequests: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!asset) {
      return notFound(res, 'Asset not found')
    }

    return ok(res, asset)
  })
)

router.patch(
  '/:id',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = updateAssetSchema.parse(req.body)
    const existing = await prisma.asset.findUnique({ where: { id: req.params.id as string } })

    if (!existing) {
      return notFound(res, 'Asset not found')
    }

    const asset = await prisma.asset.update({
      where: { id: req.params.id as string },
      data: {
        ...input,
        acquisitionCost: input.acquisitionCost?.toString(),
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'UPDATED_ASSET',
      entityType: 'ASSET',
      entityId: asset.id,
      description: `Updated asset ${asset.tag}.`,
    })

    return ok(res, asset)
  })
)

export { router as assetRoutes }
