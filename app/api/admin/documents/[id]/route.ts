import { handler, json, HttpError } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { documentSchema, statusPatch } from '@/lib/validate'
import { tx, q, isUuid } from '@/lib/db'
import { assertFiles } from '@/lib/admin-helpers'
import { deleteFiles } from '@/lib/storage'

const need = (id: string) => { if (!isUuid(id)) throw new HttpError(404, 'Document not found') }

export const PUT = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const d = documentSchema.parse(await json(req))
  const old = await tx(async c => {
    const { rows } = await c.query('select file_id from documents where id=$1 for update', [params.id])
    if (!rows[0]) throw new HttpError(404, 'Document not found')
    await assertFiles(c, [d.fileId], ['pdf'], 'document')
    await c.query(
      `update documents set title=$2,description=$3,category_id=$4,file_id=$5,allow_download=$6,status=$7,
         published_at = case when $7='published' then coalesce(published_at, now()) else published_at end where id=$1`,
      [params.id, d.title, d.description, d.categoryId, d.fileId, d.allowDownload, d.status])
    return rows[0].file_id !== d.fileId ? rows[0].file_id as string : null
  })
  await deleteFiles([old])
  return { ok: true }
})

export const PATCH = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const { status } = statusPatch.parse(await json(req))
  const r = await q(`update documents set status=$2, published_at = case when $2='published' then coalesce(published_at, now()) else published_at end where id=$1 returning id`, [params.id, status])
  if (!r.length) throw new HttpError(404, 'Document not found')
  return { ok: true, status }
})

export const DELETE = handler(async (_req, { params }) => {
  await apiAdmin(); need(params.id)
  const file = await tx(async c => {
    const { rows } = await c.query('delete from documents where id=$1 returning file_id', [params.id])
    if (!rows[0]) throw new HttpError(404, 'Document not found')
    return rows[0].file_id as string
  })
  await deleteFiles([file])
  return { ok: true }
})
