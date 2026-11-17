import { handler, json } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { documentSchema } from '@/lib/validate'
import { tx } from '@/lib/db'
import { assertFiles } from '@/lib/admin-helpers'

export const POST = handler(async req => {
  const admin = await apiAdmin()
  const d = documentSchema.parse(await json(req))
  const id = await tx(async c => {
    await assertFiles(c, [d.fileId], ['pdf'], 'document')
    const { rows } = await c.query(
      `insert into documents(title,description,category_id,file_id,allow_download,status,created_by,published_at)
       values($1,$2,$3,$4,$5,$6,$7, case when $6='published' then now() end) returning id`,
      [d.title, d.description, d.categoryId, d.fileId, d.allowDownload, d.status, admin.id])
    return rows[0].id as string
  })
  return { id }
})
