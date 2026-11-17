import { handler, HttpError } from '@/lib/http'
import { apiUser } from '@/lib/auth'
import { q, q1, isUuid } from '@/lib/db'

async function target(id: string) {
  if (!isUuid(id) || !(await q1(`select 1 from courses where id=$1 and status='published'`, [id]))) throw new HttpError(404, 'Course not found')
}
export const POST = handler(async (_req, { params }) => {
  const u = await apiUser(); await target(params.id)
  await q('insert into enrollments(user_id,course_id) values($1,$2) on conflict do nothing', [u.id, params.id])
  return { ok: true }
})
export const DELETE = handler(async (_req, { params }) => {
  const u = await apiUser()
  if (isUuid(params.id)) await q('delete from enrollments where user_id=$1 and course_id=$2', [u.id, params.id])
  return { ok: true }
})
