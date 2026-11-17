import { handler, json, HttpError } from '@/lib/http'
import { registerSchema } from '@/lib/validate'
import { createSession, hashPassword, throttle } from '@/lib/auth'
import { q1 } from '@/lib/db'

export const POST = handler(async req => {
  throttle(`reg:${req.headers.get('x-forwarded-for') ?? 'local'}`, 20, 60 * 60_000)
  const d = registerSchema.parse(await json(req))
  if (await q1('select 1 from users where email=$1', [d.email])) throw new HttpError(409, 'An account with this email already exists. Try logging in.', { email: 'This email is already registered' })
  let user
  try {
    user = await q1(`insert into users(full_name,email,password_hash,role) values($1,$2,$3,'student') returning id, role`, [d.fullName, d.email, await hashPassword(d.password)])
  } catch (e: any) {
    if (e?.code === '23505') throw new HttpError(409, 'An account with this email already exists. Try logging in.', { email: 'This email is already registered' })
    throw e
  }
  await createSession(user.id, user.role)
  return { ok: true, redirect: '/dashboard' }
})
