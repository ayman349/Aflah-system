import { z } from 'zod'
import { handler, json, HttpError } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { q, q1, isUuid } from '@/lib/db'

const need = (id: string) => { if (!isUuid(id)) throw new HttpError(404, 'Student not found') }

export const PATCH = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const { active } = z.object({ active: z.boolean() }).parse(await json(req))
  const u = await q1(`update users set is_active=$2 where id=$1 and role='student' returning id`, [params.id, active])
  if (!u) throw new HttpError(404, 'Student not found')
  if (!active) await q('delete from sessions where user_id=$1', [params.id]) // log them out immediately
  return { ok: true, active }
})

export const DELETE = handler(async (_req, { params }) => {
  await apiAdmin(); need(params.id)
  const r = await q(`delete from users where id=$1 and role='student' returning id`, [params.id])
  if (!r.length) throw new HttpError(404, 'Student not found')
  return { ok: true }
})
