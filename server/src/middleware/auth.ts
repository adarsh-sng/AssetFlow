import type { NextFunction, Request, Response } from 'express'
import type { EmployeeRole } from '@prisma/client'
import { authCookieName, verifyAuthToken } from '../lib/auth-token.ts'
import { prisma } from '../lib/prisma.ts'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: EmployeeRole
  departmentId: string | null
}

export type AuthenticatedRequest = Request & {
  user?: AuthUser
}

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return new Map<string, string>()
  }

  return new Map(
    cookieHeader.split(';').map((cookie) => {
      const [name, ...value] = cookie.trim().split('=')
      return [name, value.join('=')]
    })
  )
}

function tokenFromRequest(req: Request) {
  const authorization = req.header('authorization')

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length)
  }

  return parseCookies(req.header('cookie')).get(authCookieName)
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = tokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const payload = verifyAuthToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: payload.sub,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  })

  if (!employee) {
    return res.status(401).json({ error: 'User is inactive or no longer exists' })
  }

  req.user = employee
  return next()
}

export function requireRole(...roles: EmployeeRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    return next()
  }
}
