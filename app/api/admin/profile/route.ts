import { handler, json, HttpError } from '@/lib/http'
import { apiAdmin, hashPassword, verifyPassword, createSession } from '@/lib/auth'
import { profileSchema, passwordRule } from '@/lib/validate'
import { q, q1 } from '@/lib/db'

export const PATCH = handler(async req => {
  const me = await apiAdmin()
  const d = profileSchema.parse(await json(req))
  await q('update users set full_name=$2 where id=$1', [me.id, d.fullName])
  if (d.newPassword) {
    const np = passwordRule.safeParse(d.newPassword)
    if (!np.success) throw new HttpError(400, np.error.issues[0].message, { newPassword: np.error.issues[0].message })
    const row = await q1('select password_hash from users where id=$1', [me.id])
    if (!d.currentPassword || !(await verifyPassword(d.currentPassword, row.password_hash)))
      throw new HttpError(400, 'Current password is incorrect', { currentPassword: 'Current password is incorrect' })
    await q('update users set password_hash=$2 where id=$1', [me.id, await hashPassword(d.newPassword)])
    await q('delete from sessions where user_id=$1', [me.id])
    await createSession(me.id, me.role)
  }
  return { ok: true }
})
