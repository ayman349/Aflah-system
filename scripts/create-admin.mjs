// Creates (or promotes) the first administrator. Admins can NOT be created from the public site.
// Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='Strong#Pass1' ADMIN_NAME='Your Name' npm run admin:create
import bcrypt from 'bcryptjs'
import { client } from './_env.mjs'
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || ''
const name = (process.env.ADMIN_NAME || 'Administrator').trim()
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error('Set ADMIN_EMAIL to a valid email address.'); process.exit(1) }
if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  console.error('ADMIN_PASSWORD must be 8+ characters with upper-case, lower-case and a number.'); process.exit(1) }
const c = client(); await c.connect()
try {
  const hash = await bcrypt.hash(password, 12)
  const r = await c.query(
    `insert into users(full_name,email,password_hash,role) values($1,$2,$3,'admin')
     on conflict (email) do update set role='admin', is_active=true, password_hash=excluded.password_hash returning id`, [name, email, hash])
  await c.query('delete from sessions where user_id=$1', [r.rows[0].id])
  console.log(`Administrator ready: ${email}`)
} finally { await c.end() }
