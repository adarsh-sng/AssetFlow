import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, badRequest, conflict, created, notFound, ok } from '../lib/http.ts'
import { logActivity, notify } from '../lib/events.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

const allocationSchema = z
  .object({
    assetId: z.string(),
    targetType: z.enum(['EMPLOYEE', 'DEPARTMENT']),
    employeeId: z.string().optional(),
    departmentId: z.string().optional(),
    expectedReturnAt: z.coerce.date().optional(),
    checkOutNotes: z.string().optional(),
  })
  .refine((value) => value.targetType !== 'EMPLOYEE' || value.employeeId, {
    message: 'employeeId is required for employee allocation',
    path: ['employeeId'],
  })
  .refine((value) => value.targetType !== 'DEPARTMENT' || value.departmentId, {
    message: 'departmentId is required for department allocation',
    path: ['departmentId'],
  })

const returnSchema = z.object({
  checkInNotes: z.string().optional(),
  returnCondition: z.string().optional(),
  needsMaintenance: z.boolean().optional(),
})

const transferSchema = z
  .object({
    assetId: z.string(),
    toTargetType: z.enum(['EMPLOYEE', 'DEPARTMENT']),
    toEmployeeId: z.string().optional(),
    toDepartmentId: z.string().optional(),
    reason: z.string().trim().min(3),
  })
  .refine((value) => value.toTargetType !== 'EMPLOYEE' || value.toEmployeeId, {
    message: 'toEmployeeId is required for employee transfer',
    path: ['toEmployeeId'],
  })
  .refine((value) => value.toTargetType !== 'DEPARTMENT' || value.toDepartmentId, {
    message: 'toDepartmentId is required for department transfer',
    path: ['toDepartmentId'],
  })

async function activeAllocation(assetId: string) {
  return prisma.assetAllocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  })
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const allocations = await prisma.assetAllocation.findMany({
      where: { status: req.query.status as never },
      orderBy: { allocatedAt: 'desc' },
      include: {
        asset: true,
        employee: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    })
    return ok(res, allocations)
  })
)

router.post(
  '/',
  requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = allocationSchema.parse(req.body)
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } })

    if (!asset) {
      return notFound(res, 'Asset not found')
    }

    const current = await activeAllocation(input.assetId)

    if (asset.status !== 'AVAILABLE' || current) {
      return conflict(res, 'Asset is already allocated or unavailable', {
        currentHolder: current?.employee ?? current?.department ?? null,
        transferRequired: true,
      })
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const createdAllocation = await tx.assetAllocation.create({
        data: {
          assetId: input.assetId,
          targetType: input.targetType,
          employeeId: input.employeeId,
          departmentId: input.departmentId,
          expectedReturnAt: input.expectedReturnAt,
          checkOutNotes: input.checkOutNotes,
          createdById: req.user?.id,
        },
      })

      await tx.asset.update({
        where: { id: input.assetId },
        data: { status: 'ALLOCATED' },
      })

      return createdAllocation
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'ALLOCATED_ASSET',
      entityType: 'ALLOCATION',
      entityId: allocation.id,
      description: `Allocated asset ${asset.tag}.`,
    })

    if (input.employeeId) {
      await notify({
        recipientId: input.employeeId,
        type: 'ASSET',
        title: 'Asset assigned',
        message: `${asset.tag} has been assigned to you.`,
        entityType: 'ALLOCATION',
        entityId: allocation.id,
      })
    }

    return created(res, allocation)
  })
)

router.post(
  '/:id/return',
  requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = returnSchema.parse(req.body)
    const allocation = await prisma.assetAllocation.findUnique({
      where: { id: req.params.id as string },
      include: { asset: true },
    })

    if (!allocation || allocation.status !== 'ACTIVE') {
      return notFound(res, 'Active allocation not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAllocation = await tx.assetAllocation.update({
        where: { id: allocation.id },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          checkInNotes: input.checkInNotes,
          returnCondition: input.returnCondition,
        },
      })

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: input.needsMaintenance ? 'UNDER_MAINTENANCE' : 'AVAILABLE' },
      })

      return updatedAllocation
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'RETURNED_ASSET',
      entityType: 'ALLOCATION',
      entityId: result.id,
      description: `Returned asset ${allocation.asset.tag}.`,
    })

    return ok(res, result)
  })
)

router.get(
  '/transfers',
  asyncRoute(async (req, res) => {
    const transfers = await prisma.transferRequest.findMany({
      where: { status: req.query.status as never },
      orderBy: { createdAt: 'desc' },
      include: {
        asset: true,
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        toEmployee: { select: { id: true, name: true, email: true } },
        toDepartment: { select: { id: true, name: true } },
      },
    })
    return ok(res, transfers)
  })
)

router.post(
  '/transfers',
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = transferSchema.parse(req.body)
    const current = await activeAllocation(input.assetId)

    if (!current) {
      return badRequest(res, 'Only allocated assets can be transferred')
    }

    const transfer = await prisma.transferRequest.create({
      data: {
        assetId: input.assetId,
        fromAllocationId: current.id,
        toTargetType: input.toTargetType,
        toEmployeeId: input.toEmployeeId,
        toDepartmentId: input.toDepartmentId,
        reason: input.reason,
        requestedById: req.user?.id,
      },
      include: { asset: true },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'REQUESTED_TRANSFER',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      description: `Requested transfer for ${transfer.asset.tag}.`,
    })

    return created(res, transfer)
  })
)

router.patch(
  '/transfers/:id/approve',
  requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const transfer = await prisma.transferRequest.findUnique({
      where: { id: req.params.id as string },
      include: { asset: true, fromAllocation: true },
    })

    if (!transfer || transfer.status !== 'REQUESTED' || !transfer.fromAllocation) {
      return notFound(res, 'Pending transfer not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.assetAllocation.update({
        where: { id: transfer.fromAllocationId ?? '' },
        data: {
          status: 'TRANSFERRED',
          returnedAt: new Date(),
        },
      })

      const newAllocation = await tx.assetAllocation.create({
        data: {
          assetId: transfer.assetId,
          targetType: transfer.toTargetType,
          employeeId: transfer.toEmployeeId,
          departmentId: transfer.toDepartmentId,
          createdById: req.user?.id,
        },
      })

      return tx.transferRequest.update({
        where: { id: transfer.id },
        data: {
          status: 'APPROVED',
          approvedById: req.user?.id,
          decidedAt: new Date(),
          resultingAllocationId: newAllocation.id,
        },
      })
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'APPROVED_TRANSFER',
      entityType: 'TRANSFER',
      entityId: result.id,
      description: `Approved transfer for ${transfer.asset.tag}.`,
    })

    return ok(res, result)
  })
)

router.patch(
  '/transfers/:id/reject',
  requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const transfer = await prisma.transferRequest.update({
      where: { id: req.params.id as string },
      data: {
        status: 'REJECTED',
        approvedById: req.user?.id,
        decidedAt: new Date(),
      },
    })

    return ok(res, transfer)
  })
)

export { router as allocationRoutes }
