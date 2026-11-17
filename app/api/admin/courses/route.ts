import { handler, json } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { courseSchema } from '@/lib/validate'
import { tx } from '@/lib/db'
import { assertFiles } from '@/lib/admin-helpers'

export const POST = handler(async req => {
  const admin = await apiAdmin()
  const d = courseSchema.parse(await json(req))
  const id = await tx(async c => {
    await assertFiles(c, [d.thumbnailFileId], ['image'], 'thumbnail')
    await assertFiles(c, d.videos.map(v => v.fileId), ['video'], 'video')
    const { rows } = await c.query(
      `insert into courses(title,description,instructor_name,category_id,level,duration,status,thumbnail_file_id,created_by,published_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9, case when $7='published' then now() end) returning id`,
      [d.title, d.description, d.instructorName, d.categoryId, d.level, d.duration, d.status, d.thumbnailFileId, admin.id])
    for (const [i, v] of d.videos.entries())
      await c.query('insert into course_videos(course_id,title,file_id,external_url,position) values($1,$2,$3,$4,$5)', [rows[0].id, v.title || `Video ${i + 1}`, v.fileId, v.fileId ? null : v.url, i])
    return rows[0].id as string
  })
  return { id }
})
