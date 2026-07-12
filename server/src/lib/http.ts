import type { NextFunction, Request, Response } from 'express'

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json(data)
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201)
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function notFound(res: Response, message = 'Resource not found') {
  return res.status(404).json({ error: message })
}

export function conflict(res: Response, message: string, details?: unknown) {
  return res.status(409).json({ error: message, details })
}

export function badRequest(res: Response, message: string, details?: unknown) {
  return res.status(400).json({ error: message, details })
}

export function routeParam(value: string | string[] | undefined, name: string) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing route parameter: ${name}`)
  }

  return value
}

export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
