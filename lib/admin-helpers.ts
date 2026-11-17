import { PoolClient } from 'pg'
import { HttpError } from './http'

/** Make sure every referenced file exists and is of an acceptable kind. */
export async function assertFiles(c: PoolClient, ids: (string | null)[], kinds: string[], label: string) {
  const list = ids.filter(Boolean) as string[]
  if (!list.length) return
  const { rows } = await c.query('select id from files where id = any($1::uuid[]) and kind = any($2::text[])', [list, kinds])
  if (rows.length !== new Set(list).size) throw new HttpError(400, `Invalid ${label} file. Please upload it again.`)
}
export const stamp = (status: string) => (status === 'published' ? 'now()' : 'null')
