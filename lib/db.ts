import { Pool, PoolClient, QueryResultRow } from 'pg'

const g = globalThis as unknown as { _aflaxPool?: Pool }
export const pool =
  g._aflaxPool ??
  (g._aflaxPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 10,
  }))

export async function q<T extends QueryResultRow = any>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(text, params)).rows
}
export async function q1<T extends QueryResultRow = any>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null
}
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('begin')
    const r = await fn(c)
    await c.query('commit')
    return r
  } catch (e) {
    await c.query('rollback').catch(() => {})
    throw e
  } finally { c.release() }
}
export const isUuid = (s: unknown): s is string =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
