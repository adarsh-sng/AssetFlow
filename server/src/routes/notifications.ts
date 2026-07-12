import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, ok, routeParam } from '../lib/http.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

router.get(
  '/',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const query = z
      .object({
        type: z.string().optional(),
        unread: z.coerce.boolean().optional(),
      })
      .parse(req.query)

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ recipientId: req.user?.id }, { recipientId: null }],
        type: query.type as never,
        readAt: query.unread ? null : undefined,
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(res, notifications)
  })
)

router.patch(
  '/:id/read',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const notification = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })

    return ok(res, notification)
  })
)

router.get(
  '/activity',
  asyncRoute(async (req, res) => {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    })

    return ok(res, logs)
  })
)

export { router as notificationRoutes }
