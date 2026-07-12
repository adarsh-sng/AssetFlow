import { Router } from 'express'
import { z } from 'zod'
import { authCookie, createAuthToken, expiredAuthCookie } from '../lib/auth-token.ts'
import { hashPassword, verifyPassword } from '../lib/password.ts'
import { prisma } from '../lib/prisma.ts'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts'

const router = Router()

const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  departmentId: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
})

function publicEmployee(employee: {
  id: string
  name: string
  email: string
  role: string
  status: string
  departmentId: string | null
}) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    status: employee.status,
    departmentId: employee.departmentId,
  }
}

router.post('/signup', async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body)
    const existing = await prisma.employee.findUnique({
      where: { email: input.email },
      select: { id: true },
    })

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    if (input.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: input.departmentId, status: 'ACTIVE' },
        select: { id: true },
      })

      if (!department) {
        return res.status(400).json({ error: 'Department is invalid or inactive' })
      }
    }

    const employee = await prisma.employee.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        departmentId: input.departmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
      },
    })

    const token = createAuthToken({ employeeId: employee.id, role: employee.role })

    res.setHeader('Set-Cookie', authCookie(token))
    return res.status(201).json({ user: publicEmployee(employee), token })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body)
    const employee = await prisma.employee.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
        departmentId: true,
      },
    })

    if (!employee || employee.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const validPassword = await verifyPassword(input.password, employee.passwordHash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = createAuthToken({ employeeId: employee.id, role: employee.role })

    res.setHeader('Set-Cookie', authCookie(token))
    return res.json({ user: publicEmployee(employee), token })
  } catch (error) {
    return next(error)
  }
})

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', expiredAuthCookie())
  return res.status(204).send()
})

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user })
})

export { router as authRoutes }
