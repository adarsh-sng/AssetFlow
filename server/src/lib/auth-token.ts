import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../../env.ts'

export const authCookieName = 'assetflow_session'

type TokenPayload = {
  sub: string
  role: string
  iat: number
  exp: number
}

const tokenTtlSeconds = 60 * 60 * 24 * 7

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function decode<T>(value: string) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T
}

function sign(data: string) {
  return createHmac('sha256', env.AUTH_SECRET).update(data).digest('base64url')
}

export function createAuthToken(input: { employeeId: string; role: string }) {
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    sub: input.employeeId,
    role: input.role,
    iat: now,
    exp: now + tokenTtlSeconds,
  }

  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const body = encode(payload)
  const signature = sign(`${header}.${body}`)

  return `${header}.${body}.${signature}`
}

export function verifyAuthToken(token: string) {
  const [header, body, signature] = token.split('.')

  if (!header || !body || !signature) {
    return null
  }

  const expectedSignature = sign(`${header}.${body}`)
  const actual = Buffer.from(signature, 'base64url')
  const expected = Buffer.from(expectedSignature, 'base64url')

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null
  }

  const payload = decode<TokenPayload>(body)

  if (!payload.sub || !payload.role || payload.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return payload
}

export function authCookie(token: string) {
  const maxAge = tokenTtlSeconds
  const secure = env.NODE_ENV === 'production' ? '; Secure' : ''

  return `${authCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
}

export function expiredAuthCookie() {
  return `${authCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}
