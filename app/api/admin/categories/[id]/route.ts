import { handler, HttpError } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { q } from '@/lib/db'

export const DELETE = handler(async (_req, { params }) => {
  await apiAdmin()
  if (!/^\d+$/.test(params.id)) throw new HttpError(404, 'Category not found')
  const r = await q('delete from categories where id=$1 returning id', [params.id])
  if (!r.length) throw new HttpError(404, 'Category not found')
  return { ok: true }
})
