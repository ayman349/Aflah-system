import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { q, q1 } from './db'
import { HttpError } from './http'

export const COOKIE = 'aflax_session'
export type SessionUser = { id: string; full_name: string; email: string; role: 'student' | 'admin'; student_code: string | null }

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
export const hashPassword = (p: string) => bcrypt.hash(p, 12)
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h)
const secure = () => (process.env.APP_URL ?? '').startsWith('https://')

export async function createSession(userId: string, role: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  const hours = role === 'admin' ? 8 : 24 * 7 // admins get a shorter session
  await q(`insert into sessions(user_id, token_hash, expires_at) values($1,$2, now() + make_interval(hours => $3))`, [userId, sha(token), hours])
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: secure(), path: '/', maxAge: hours * 3600 })
  q('delete from sessions where expires_at < now()').catch(() => {}) // opportunistic cleanup
}

export async function destroySession() {
  const t = cookies().get(COOKIE)?.value
  if (t) await q('delete from sessions where token_hash=$1', [sha(t)])
  cookies().set(COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: secure(), path: '/', maxAge: 0 })
}

/** Current user from the session cookie (null if logged out, expired or deactivated). */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const t = cookies().get(COOKIE)?.value
  if (!t) return null
  return q1<SessionUser>(
    `select u.id, u.full_name, u.email, u.role, u.student_code from sessions s join users u on u.id = s.user_id
     where s.token_hash=$1 and s.expires_at > now() and u.is_active`, [sha(t)])
})

// ---- Server components / pages ----
export async function requireUser(next = '/dashboard') {
  const u = await getUser()
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`)
  return u
}
export async function requireAdminPage() {
  const u = await getUser()
  if (!u) redirect('/login?next=/admin')
  if (u.role !== 'admin') redirect('/')
  return u
}

// ---- API routes (enforced on the server, independent of what the UI shows) ----
export async function apiUser() {
  const u = await getUser()
  if (!u) throw new HttpError(401, 'Please log in first')
  return u
}
export async function apiAdmin() {
  const u = await apiUser()
  if (u.role !== 'admin') throw new HttpError(403, 'Administrator access required')
  return u
}

// Simple in-memory brute-force throttle (per server process).
const attempts = new Map<string, { n: number; t: number }>()
export function throttle(key: string, max = 8, windowMs = 15 * 60_000) {
  const now = Date.now(); const a = attempts.get(key)
  if (!a || now - a.t > windowMs) { attempts.set(key, { n: 1, t: now }); return }
  if (++a.n > max) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.')
}
export const clearThrottle = (key: string) => attempts.delete(key)
