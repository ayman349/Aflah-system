import { handler, json, HttpError } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { courseSchema, statusPatch } from '@/lib/validate'
import { tx, q, isUuid } from '@/lib/db'
import { assertFiles } from '@/lib/admin-helpers'
import { deleteFiles } from '@/lib/storage'

const need = (id: string) => { if (!isUuid(id)) throw new HttpError(404, 'Course not found') }

export const PUT = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const d = courseSchema.parse(await json(req))
  const removed = await tx(async c => {
    const { rows: cur } = await c.query('select thumbnail_file_id from courses where id=$1 for update', [params.id])
    if (!cur[0]) throw new HttpError(404, 'Course not found')
    await assertFiles(c, [d.thumbnailFileId], ['image'], 'thumbnail')
    await assertFiles(c, d.videos.map(v => v.fileId), ['video'], 'video')
    const { rows: oldVids } = await c.query('select file_id from course_videos where course_id=$1 and file_id is not null', [params.id])
    await c.query(
      `update courses set title=$2,description=$3,instructor_name=$4,category_id=$5,level=$6,duration=$7,status=$8,thumbnail_file_id=$9,
         published_at = case when $8='published' then coalesce(published_at, now()) else published_at end where id=$1`,
      [params.id, d.title, d.description, d.instructorName, d.categoryId, d.level, d.duration, d.status, d.thumbnailFileId])
    await c.query('delete from course_videos where course_id=$1', [params.id])
    for (const [i, v] of d.videos.entries())
      await c.query('insert into course_videos(course_id,title,file_id,external_url,position) values($1,$2,$3,$4,$5)', [params.id, v.title || `Video ${i + 1}`, v.fileId, v.fileId ? null : v.url, i])
    const keep = new Set(d.videos.map(v => v.fileId))
    const gone = oldVids.map(r => r.file_id as string).filter(f => !keep.has(f))
    if (cur[0].thumbnail_file_id && cur[0].thumbnail_file_id !== d.thumbnailFileId) gone.push(cur[0].thumbnail_file_id)
    return gone
  })
  await deleteFiles(removed)
  return { ok: true }
})

export const PATCH = handler(async (req, { params }) => {
  await apiAdmin(); need(params.id)
  const { status } = statusPatch.parse(await json(req))
  const r = await q(`update courses set status=$2, published_at = case when $2='published' then coalesce(published_at, now()) else published_at end where id=$1 returning id`, [params.id, status])
  if (!r.length) throw new HttpError(404, 'Course not found')
  return { ok: true, status }
})

export const DELETE = handler(async (_req, { params }) => {
  await apiAdmin(); need(params.id)
  const files = await tx(async c => {
    const { rows } = await c.query(
      `select thumbnail_file_id as f from courses where id=$1 union all select file_id from course_videos where course_id=$1`, [params.id])
    const r = await c.query('delete from courses where id=$1', [params.id])
    if (!r.rowCount) throw new HttpError(404, 'Course not found')
    return rows.map(x => x.f as string)
  })
  await deleteFiles(files)
  return { ok: true }
})
