// Run after restarting the server: data + uploaded files must still be there.
import fs from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:3100'
const st = JSON.parse(fs.readFileSync('tests/.state.json', 'utf8'))
let pass = 0, fail = 0; const ok = (c, n) => { c ? pass++ : fail++; console.log(`${c ? '  PASS' : '  FAIL'}  ${n}`) }
const login = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: st.email, password: 'Strong#Pass1' }) })
const cookie = login.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
ok(login.status === 200, 'student can still log in after restart (credentials persisted)')
const c = await fetch(`${BASE}/courses/${st.course}`, { headers: { cookie } }); ok(c.status === 200 && (await c.text()).includes('Home Wiring Basics v2'), 'course still in database')
const f = await fetch(`${BASE}/media/${st.pdfId}`, { headers: { cookie } }); ok(f.status === 200 && (await f.arrayBuffer()).byteLength === st.bytes, 'uploaded PDF still served, same size')
const l = await fetch(`${BASE}/documentation/lessons/${st.lessonId}`, { headers: { cookie } }); ok(l.status === 200 && (await l.text()).includes('Older lesson EDITED'), 'lesson still in database')
console.log(`\n==== ${pass} passed, ${fail} failed ====`); process.exit(fail ? 1 : 0)
