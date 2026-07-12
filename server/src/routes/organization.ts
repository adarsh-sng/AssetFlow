import { Router } from 'express'
import { z } from 'zod'
import { asyncRoute, created, noContent, notFound, ok, routeParam } from '../lib/http.ts'
import { logActivity } from '../lib/events.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

const departmentSchema = z.object({
  name: z.string().trim().min(2),
  headId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

const categorySchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  defaultBookable: z.boolean().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
})

const employeeUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  departmentId: z.string().nullable().optional(),
  role: z.enum(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

router.get(
  '/departments',
  asyncRoute(async (req, res) => {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
      },
    })
    return ok(res, departments)
  })
)

router.post(
  '/departments',
  requireRole('ADMIN'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = departmentSchema.parse(req.body)
    const department = await prisma.department.create({ data: input })

    await logActivity({
      actorId: req.user?.id,
      action: 'CREATED_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      description: `Created department ${department.name}.`,
    })

    return created(res, department)
  })
)

router.patch(
  '/departments/:id',
  requireRole('ADMIN'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const input = departmentSchema.partial().parse(req.body)
    const existing = await prisma.department.findUnique({ where: { id } })

    if (!existing) {
      return notFound(res, 'Department not found')
    }

    const department = await prisma.department.update({
      where: { id },
      data: input,
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'UPDATED_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      description: `Updated department ${department.name}.`,
    })

    return ok(res, department)
  })
)

router.get(
  '/categories',
  asyncRoute(async (req, res) => {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    })
    return ok(res, categories)
  })
)

router.post(
  '/categories',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const input = categorySchema.parse(req.body)
    const category = await prisma.assetCategory.create({
      data: { ...input, customFields: input.customFields as never },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'CREATED_ASSET_CATEGORY',
      entityType: 'ASSET_CATEGORY',
      entityId: category.id,
      description: `Created asset category ${category.name}.`,
    })

    return created(res, category)
  })
)

router.patch(
  '/categories/:id',
  requireRole('ADMIN', 'ASSET_MANAGER'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const input = categorySchema.partial().parse(req.body)
    const existing = await prisma.assetCategory.findUnique({ where: { id } })

    if (!existing) {
      return notFound(res, 'Category not found')
    }

    const category = await prisma.assetCategory.update({
      where: { id },
      data: { ...input, customFields: input.customFields as never },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'UPDATED_ASSET_CATEGORY',
      entityType: 'ASSET_CATEGORY',
      entityId: category.id,
      description: `Updated asset category ${category.name}.`,
    })

    return ok(res, category)
  })
)

router.get(
  '/employees',
  requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  asyncRoute(async (req, res) => {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    })
    return ok(res, employees)
  })
)

router.patch(
  '/employees/:id',
  requireRole('ADMIN'),
  asyncRoute(async (req: AuthenticatedRequest, res) => {
    const id = routeParam(req.params.id, 'id')
    const input = employeeUpdateSchema.parse(req.body)
    const existing = await prisma.employee.findUnique({ where: { id } })

    if (!existing) {
      return notFound(res, 'Employee not found')
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
      },
    })

    await logActivity({
      actorId: req.user?.id,
      action: 'UPDATED_EMPLOYEE',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      description: `Updated employee ${employee.name}.`,
      metadata: { role: employee.role, status: employee.status },
    })

    return ok(res, employee)
  })
)

router.delete(
  '/departments/:id',
  requireRole('ADMIN'),
  asyncRoute(async (req, res) => {
    const id = routeParam(req.params.id, 'id')
    await prisma.department.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })
    return noContent(res)
  })
)

export { router as organizationRoutes }
