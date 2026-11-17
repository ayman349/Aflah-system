import { handler, json, HttpError } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { lessonSchema, statusPatch } from '@/lib/validate'
import { tx, q, isUuid } from '@/lib/db'
import { assertFiles } from '@/lib/admin-helpers'
import { deleteFiles } from '@/lib/storage'

const need = (id: string) => { if (!isUuid(id)) throw new HttpError(404, 'Lesson not found') }

export const PUT = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const d = lessonSchema.parse(await json(req))
  const removed = await tx(async c => {
    const { rows: ex } = await c.query('select id from daily_lessons where id=$1 for update', [params.id])
    if (!ex[0]) throw new HttpError(404, 'Lesson not found')
    await assertFiles(c, d.attachmentIds, ['attachment'], 'attachment')
    const { rows: old } = await c.query('select file_id from lesson_attachments where lesson_id=$1', [params.id])
    await c.query('update daily_lessons set title=$2,content=$3,category_id=$4,publish_date=$5,status=$6 where id=$1',
      [params.id, d.title, d.content, d.categoryId, d.publishDate, d.status])
    await c.query('delete from lesson_attachments where lesson_id=$1', [params.id])
    for (const f of d.attachmentIds) await c.query('insert into lesson_attachments(lesson_id,file_id) values($1,$2)', [params.id, f])
    return old.map(r => r.file_id as string).filter(f => !d.attachmentIds.includes(f))
  })
  await deleteFiles(removed)
  return { ok: true }
})

export const PATCH = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const { status } = statusPatch.parse(await json(req))
  const r = await q('update daily_lessons set status=$2 where id=$1 returning id', [params.id, status])
  if (!r.length) throw new HttpError(404, 'Lesson not found')
  return { ok: true, status }
})

export const DELETE = handler(async (_req, { params }) => {
  await apiAdmin(); need(params.id)
  const files = await tx(async c => {
    const { rows } = await c.query('select file_id from lesson_attachments where lesson_id=$1', [params.id])
    const r = await c.query('delete from daily_lessons where id=$1', [params.id])
    if (!r.rowCount) throw new HttpError(404, 'Lesson not found')
    return rows.map(x => x.file_id as string)
  })
  await deleteFiles(files)
  return { ok: true }
})
