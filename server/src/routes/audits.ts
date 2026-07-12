import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, badRequest, created, notFound, ok } from '../lib/http.ts'
import { logActivity, notify } from '../lib/events.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

const createAuditSchema = z.object({
  name: z.string().trim().min(3),
  scope: z.string().trim().min(2),
  departmentId: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  auditorIds: z.array(z.string()).default([]),
  assetIds: z.array(z.string()).default([]),
})

const updateItemSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'MISSING', 'DAMAGED']),
  actualLocation: z.string().optional(),
  notes: z.string().optional(),
})

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const audits = await prisma.auditCycle.findMany({
      where: { status: req.query.status as never },
      include: {
        department: { select: { id: true, name: true } },
        assignments: { include: { auditor: { select: { id: true, name: true, email: true } } } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(res, audits)
  })
)

router.post(
  '/',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = createAuditSchema.parse(req.body)

    if (input.endsAt <= input.startsAt) {
      return badRequest(res, 'Audit end date must be after start date')
    }

    const audit = await prisma.auditCycle.create({
      data: {
        name: input.name,
        scope: input.scope,
        status: 'ACTIVE',
        departmentId: input.departmentId,
        location: input.location,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        assignments: {
          create: input.auditorIds.map((auditorId) => ({ auditorId })),
        },
        items: {
          create: input.assetIds.map((assetId) => ({
            assetId,
            expectedLocation: input.location,
          })),
        },
      },
      include: {
        assignments: true,
        items: true,
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'CREATED_AUDIT',
      entityType: 'AUDIT',
      entityId: audit.id,
      description: `Created audit cycle ${audit.name}.`,
    })

    return created(res, audit)
  })
)

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const audit = await prisma.auditCycle.findUnique({
      where: { id: req.params.id as string },
      include: {
        department: { select: { id: true, name: true } },
        assignments: { include: { auditor: { select: { id: true, name: true, email: true } } } },
        items: {
          include: {
            asset: true,
            verifiedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!audit) {
      return notFound(res, 'Audit cycle not found')
    }

    return ok(res, audit)
  })
)

router.patch(
  '/:id/items/:itemId',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = updateItemSchema.parse(req.body)
    const audit = await prisma.auditCycle.findUnique({ where: { id: req.params.id as string } })

    if (!audit) {
      return notFound(res, 'Audit cycle not found')
    }

    if (audit.status === 'CLOSED') {
      return badRequest(res, 'Closed audit cycles cannot be edited')
    }

    const item = await prisma.auditItem.update({
      where: { id: req.params.itemId as string },
      data: {
        status: input.status,
        actualLocation: input.actualLocation,
        notes: input.notes,
        verifiedById: req.user?.id,
        verifiedAt: new Date(),
      },
      include: { asset: true },
    })

    if (input.status === 'MISSING' || input.status === 'DAMAGED') {
      await notify({
        type: 'AUDIT',
        title: 'Audit discrepancy flagged',
        message: `${item.asset.tag} was marked ${input.status.toLowerCase()}.`,
        entityType: 'AUDIT',
        entityId: audit.id,
      })
    }

    return ok(res, item)
  })
)

router.post(
  '/:id/close',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const audit = await prisma.auditCycle.findUnique({
      where: { id: req.params.id as string },
      include: { items: true },
    })

    if (!audit) {
      return notFound(res, 'Audit cycle not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of audit.items) {
        if (item.status === 'MISSING') {
          await tx.asset.update({ where: { id: item.assetId }, data: { status: 'LOST' } })
        }
        if (item.status === 'DAMAGED') {
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: 'UNDER_MAINTENANCE' },
          })
        }
      }

      return tx.auditCycle.update({
        where: { id: audit.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      })
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'CLOSED_AUDIT',
      entityType: 'AUDIT',
      entityId: result.id,
      description: `Closed audit cycle ${result.name}.`,
    })

    return ok(res, result)
  })
)

export { router as auditRoutes }
