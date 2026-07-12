import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, created, notFound, ok, routeParam } from '../lib/http.ts'
import { logActivity, notify } from '../lib/events.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

const createMaintenanceSchema = z.object({
  assetId: z.string(),
  issue: z.string().trim().min(3),
  description: z.string().trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  attachmentUrl: z.string().url().optional(),
})

const assignSchema = z.object({
  technicianId: z.string(),
})

const resolveSchema = z.object({
  resolutionNote: z.string().trim().optional(),
})

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        status: req.query.status as never,
        priority: req.query.priority as never,
      },
      include: {
        asset: true,
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return ok(res, requests)
  })
)

router.post(
  '/',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = createMaintenanceSchema.parse(req.body)
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } })

    if (!asset) {
      return notFound(res, 'Asset not found')
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        ...input,
        requestedById: req.user?.id,
        status: 'PENDING',
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'RAISED_MAINTENANCE',
      entityType: 'MAINTENANCE',
      entityId: request.id,
      description: `Raised maintenance request for ${asset.tag}.`,
    })

    return created(res, request)
  })
)

router.patch(
  '/:id/approve',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true, requestedBy: true },
    })

    if (!request) {
      return notFound(res, 'Maintenance request not found')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const approved = await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          approvedById: req.user?.id,
          approvedAt: new Date(),
        },
      })

      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: 'UNDER_MAINTENANCE' },
      })

      return approved
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'APPROVED_MAINTENANCE',
      entityType: 'MAINTENANCE',
      entityId: updated.id,
      description: `Approved maintenance for ${request.assetId}.`,
    })

    if (request.requestedById) {
      await notify({
        recipientId: request.requestedById,
        type: 'MAINTENANCE',
        title: 'Maintenance approved',
        message: `Maintenance request for ${request.assetId} was approved.`,
        entityType: 'MAINTENANCE',
        entityId: updated.id,
      })
    }

    return ok(res, updated)
  })
)

router.patch(
  '/:id/reject',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user?.id,
        approvedAt: new Date(),
      },
    })

    return ok(res, request)
  })
)

router.patch(
  '/:id/assign-technician',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const input = assignSchema.parse(req.body)
    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'TECHNICIAN_ASSIGNED',
        technicianId: input.technicianId,
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'ASSIGNED_TECHNICIAN',
      entityType: 'MAINTENANCE',
      entityId: request.id,
      description: 'Assigned technician to maintenance request.',
    })

    return ok(res, request)
  })
)

router.patch(
  '/:id/start',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req, res) => {
    const id = routeParam(req.params.id, 'id')
    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    })

    return ok(res, request)
  })
)

router.patch(
  '/:id/resolve',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const input = resolveSchema.parse(req.body)
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    })

    if (!request) {
      return notFound(res, 'Maintenance request not found')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resolved = await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNote: input.resolutionNote,
        },
      })

      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: 'AVAILABLE' },
      })

      return resolved
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'RESOLVED_MAINTENANCE',
      entityType: 'MAINTENANCE',
      entityId: updated.id,
      description: `Resolved maintenance for ${request.assetId}.`,
    })

    return ok(res, updated)
  })
)

export { router as maintenanceRoutes }
