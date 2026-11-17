// Applies every db/migrations/*.sql file once, in order. Safe to run repeatedly.
import fs from 'node:fs'
import path from 'node:path'
import { client } from './_env.mjs'
const c = client()
await c.connect()
try {
  await c.query('create table if not exists schema_migrations(name text primary key, applied_at timestamptz not null default now())')
  const done = new Set((await c.query('select name from schema_migrations')).rows.map(r => r.name))
  const dir = path.join(process.cwd(), 'db', 'migrations')
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (done.has(f)) { console.log('skip   ', f); continue }
    await c.query('begin')
    try { await c.query(fs.readFileSync(path.join(dir, f), 'utf8')); await c.query('insert into schema_migrations(name) values($1)', [f]); await c.query('commit'); console.log('applied', f) }
    catch (e) { await c.query('rollback'); console.error('FAILED ', f, '-', e.message); process.exit(1) }
  }
  console.log('Database is up to date.')
} finally { await c.end() }
