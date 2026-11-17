import { handler, json, HttpError } from '@/lib/http'
import { loginSchema } from '@/lib/validate'
import { createSession, verifyPassword, throttle, clearThrottle } from '@/lib/auth'
import { q, q1 } from '@/lib/db'

const DUMMY = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO5G1Y8G2yEoV8n7V3g1m2n5Yb1tJk0uK' // equalises timing for unknown emails
export const POST = handler(async req => {
  const d = loginSchema.parse(await json(req))
  const key = `login:${req.headers.get('x-forwarded-for') ?? 'local'}:${d.email}`
  throttle(key)
  const u = await q1('select id, password_hash, role, is_active from users where email=$1', [d.email])
  const ok = await verifyPassword(d.password, u?.password_hash ?? DUMMY)
  if (!u || !ok) throw new HttpError(401, 'Incorrect email or password')
  if (!u.is_active) throw new HttpError(403, 'This account has been deactivated. Please contact the college.')
  clearThrottle(key)
  await q('update users set last_login_at=now() where id=$1', [u.id])
  await createSession(u.id, u.role)
  return { ok: true, role: u.role }
})
