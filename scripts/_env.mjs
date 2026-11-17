import fs from 'node:fs'
import pg from 'pg'
for (const f of ['.env.local', '.env']) if (fs.existsSync(f)) process.loadEnvFile(f)
export function client() {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.'); process.exit(1) }
  return new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined })
}
