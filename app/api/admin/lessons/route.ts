import { handler, json } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { lessonSchema } from '@/lib/validate'
import { tx } from '@/lib/db'
import { assertFiles } from '@/lib/admin-helpers'

export const POST = handler(async req => {
  const admin = await apiAdmin()
  const d = lessonSchema.parse(await json(req))
  const id = await tx(async c => {
    await assertFiles(c, d.attachmentIds, ['attachment'], 'attachment')
    const { rows } = await c.query(
      `insert into daily_lessons(title,content,category_id,publish_date,status,author_id) values($1,$2,$3,$4,$5,$6) returning id`,
      [d.title, d.content, d.categoryId, d.publishDate, d.status, admin.id])
    for (const f of d.attachmentIds) await c.query('insert into lesson_attachments(lesson_id,file_id) values($1,$2)', [rows[0].id, f])
    return rows[0].id as string
  })
  return { id }
})
