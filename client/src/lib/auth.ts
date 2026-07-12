import type { Employee } from './types'

export interface AuthResponse {
  user: Employee
  token: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(err.error || 'Login failed')
  }

  return res.json()
}

export async function signup(
  name: string,
  email: string,
  password: string,
  departmentId?: string
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password, departmentId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Signup failed' }))
    throw new Error(err.error || 'Signup failed')
  }

  return res.json()
}

export async function getMe(): Promise<{ user: Employee }> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })

  if (!res.ok) {
    throw new Error('Not authenticated')
  }

  return res.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}
