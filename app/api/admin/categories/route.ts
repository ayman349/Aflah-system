import { handler, json, HttpError } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { categorySchema } from '@/lib/validate'
import { q1 } from '@/lib/db'

export const POST = handler(async req => {
  await apiAdmin()
  const d = categorySchema.parse(await json(req))
  try { return (await q1('insert into categories(kind,name) values($1,$2) returning id, kind, name', [d.kind, d.name]))! }
  catch (e: any) { if (e?.code === '23505') throw new HttpError(409, 'That category already exists'); throw e }
})
