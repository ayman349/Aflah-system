// End-to-end HTTP tests against a running server + real PostgreSQL. Usage: BASE=http://localhost:3100 node tests/e2e.mjs
import fs from 'node:fs'
import pg from 'pg'
const BASE = process.env.BASE || 'http://localhost:3100'
const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@test.local', password: process.env.ADMIN_PASSWORD || 'TestPass123' }
let pass = 0, fail = 0
const ok = (cond, name, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}${cond ? '' : '  ' + extra}`) }
const section = t => console.log(`\n## ${t}`)

class Client {
  jar = {}
  async req(path, { method = 'GET', json, body, headers = {}, redirect = 'manual' } = {}) {
    const h = { ...headers }
    const cookie = Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; ')
    if (cookie) h.cookie = cookie
    if (json !== undefined) { h['content-type'] = 'application/json'; body = JSON.stringify(json) }
    const r = await fetch(BASE + path, { method, headers: h, body, redirect })
    for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1); if (v === '' || /max-age=0/i.test(c)) delete this.jar[k]; else this.jar[k] = v }
    return r
  }
  async j(path, o) { const r = await this.req(path, o); let d = {}; try { d = await r.clone().json() } catch {} return { r, d, s: r.status } }
  async t(path, o) { const r = await this.req(path, o); return { r, s: r.status, text: (await r.text()).replace(/<!-- -->/g, '') } }
  upload(kind, name, buf) { return this.j(`/api/admin/uploads?kind=${kind}`, { method: 'POST', body: buf, headers: { 'x-filename': encodeURIComponent(name), 'content-type': 'application/octet-stream' } }) }
}
const anon = new Client(), student = new Client(), student2 = new Client(), admin = new Client()

// ---- fixtures (tiny but with real magic bytes) ----
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(200000, 7)])
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF')
const DOCX = Buffer.concat([Buffer.from('PK\x03\x04'), Buffer.alloc(500, 1)])
const stamp = Date.now()
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const dbq = async (t, p) => (await pool.query(t, p)).rows
const exists = async id => { const [f] = await dbq('select stored_name from files where id=$1', [id]); if (!f) return { row: false, disk: false }; return { row: true, disk: fs.existsSync(`${process.env.UPLOAD_DIR || './storage'}/${f.stored_name}`) } }

section('1-3. Public pages')
{
  const h = await anon.t('/'); ok(h.s === 200 && h.text.includes('AFLAX'), 'homepage loads')
  ok(h.text.includes('Explore Courses'), 'homepage has Explore Courses button')
  ok(h.text.includes('No courses have been published yet'), 'homepage shows empty state when no published courses')
  for (const p of ['/about', '/courses', '/documentation', '/documentation/books', '/documentation/lessons', '/login', '/register']) { const r = await anon.t(p); ok(r.s === 200, `GET ${p} → 200`, String(r.s)) }
  const a = await anon.t('/about'); ok(['Electrical Installation', 'Solar Energy Systems', 'Electrical Safety', 'Practical Technical Skills'].every(x => a.text.includes(x)), 'About page lists programs')
  ok(h.text.includes('Login') && h.text.includes('Register') && !h.text.includes('Logout'), 'logged-out nav shows Login/Register')
  ok((await anon.t('/courses/not-a-uuid')).s === 404, 'invalid course id → 404')
}

section('17. Protected pages without login')
{
  for (const p of ['/dashboard', '/admin', '/admin/courses', '/admin/students']) { const r = await anon.req(p); ok([307, 308].includes(r.status) && r.headers.get('location').includes('/login'), `${p} redirects to /login`, `${r.status}`) }
  for (const [m, p] of [['POST', '/api/admin/courses'], ['POST', '/api/admin/documents'], ['POST', '/api/admin/lessons'], ['POST', '/api/admin/uploads?kind=pdf'], ['PATCH', '/api/admin/students/00000000-0000-0000-0000-000000000000']]) {
    const r = await anon.j(p, { method: m, json: {} }); ok(r.s === 401, `${m} ${p} anonymous → 401`, String(r.s)) }
  const b = await anon.req('/documentation/books/00000000-0000-0000-0000-000000000000'); ok(b.status === 307, 'document viewer requires login')
}

section('12-15. Registration & login')
const email = `mohamed.${stamp}@example.com`
{
  let r = await student.j('/api/auth/register', { method: 'POST', json: { fullName: 'Mohamed Ali', email, password: 'Strong#Pass1', confirmPassword: 'Strong#Pass1', role: 'admin' } })
  ok(r.s === 200 && r.d.ok, 'student registers', JSON.stringify(r.d))
  const [u] = await dbq('select role, password_hash, full_name from users where email=$1', [email])
  ok(u && u.role === 'student', 'DB: role is student even if client sends role=admin')
  ok(u && u.password_hash.startsWith('$2') && !u.password_hash.includes('Strong'), 'DB: password stored as bcrypt hash')
  r = await anon.j('/api/auth/register', { method: 'POST', json: { fullName: 'Dup', email: email.toUpperCase(), password: 'Strong#Pass1', confirmPassword: 'Strong#Pass1' } })
  ok(r.s === 409 && r.d.fields?.email, 'duplicate email (any case) rejected', JSON.stringify(r.d))
  r = await anon.j('/api/auth/register', { method: 'POST', json: { fullName: 'X Y', email: 'a@b.co', password: 'Strong#Pass1', confirmPassword: 'Different1' } }); ok(r.s === 400 && r.d.fields?.confirmPassword, 'password mismatch rejected')
  r = await anon.j('/api/auth/register', { method: 'POST', json: { fullName: 'X Y', email: 'a@b.co', password: 'weak', confirmPassword: 'weak' } }); ok(r.s === 400, 'weak password rejected')
  r = await anon.j('/api/auth/register', { method: 'POST', json: { fullName: 'X Y', email: 'not-an-email', password: 'Strong#Pass1', confirmPassword: 'Strong#Pass1' } }); ok(r.s === 400 && r.d.fields?.email, 'invalid email rejected')
  const home = await student.t('/'); ok(home.text.includes('Welcome, Mohamed!') && home.text.includes('Logout') && !home.text.includes('>Register<'), 'nav shows "Welcome, Mohamed!" + Logout after registering')
  const dash = await student.t('/dashboard'); ok(dash.s === 200 && dash.text.includes('Welcome, Mohamed Ali!'), 'dashboard greets the registered name from DB')
  // second student with a different name proves nothing is hard-coded
  await student2.j('/api/auth/register', { method: 'POST', json: { fullName: 'Hodan Farah', email: `hodan.${stamp}@example.com`, password: 'Strong#Pass1', confirmPassword: 'Strong#Pass1' } })
  ok((await student2.t('/')).text.includes('Welcome, Hodan!'), 'second student sees their own name (not hard-coded)')
  // login
  const fresh = new Client()
  r = await fresh.j('/api/auth/login', { method: 'POST', json: { email, password: 'wrong-password' } }); ok(r.s === 401, 'wrong password → 401')
  r = await fresh.j('/api/auth/login', { method: 'POST', json: { email, password: 'Strong#Pass1' } }); ok(r.s === 200 && r.d.role === 'student', 'existing student logs in')
  ok((await fresh.t('/')).text.includes('Welcome, Mohamed!'), 'welcome message after login')
  const cookieHdr = (await new Client().req('/api/auth/login', { method: 'POST', json: { email, password: 'Strong#Pass1' } })).headers.get('set-cookie')
  ok(/HttpOnly/i.test(cookieHdr) && /SameSite=lax/i.test(cookieHdr), 'session cookie is HttpOnly + SameSite=Lax')
  // logout
  await fresh.req('/api/auth/logout', { method: 'POST' })
  const after = await fresh.req('/dashboard'); ok(after.status === 307, 'logout invalidates session (dashboard → login)')
  r = await anon.j('/api/auth/register', { method: 'POST', json: { fullName: 'Evil', email: 'evil@x.com', password: 'Strong#Pass1', confirmPassword: 'Strong#Pass1' }, headers: { origin: 'https://evil.example' } }); ok(r.s === 403, 'cross-site Origin blocked')
}

section('18. Students cannot reach admin')
{
  const r = await student.req('/admin'); ok(r.status === 307 && new URL(r.headers.get('location'), BASE).pathname === '/', 'student /admin → redirected away', `${r.status} ${r.headers.get('location')}`)
  const r2 = await student.req('/admin/students'); ok(r2.status === 307, 'student /admin/students blocked')
  for (const [m, p] of [['POST', '/api/admin/courses'], ['POST', '/api/admin/lessons'], ['POST', '/api/admin/uploads?kind=image'], ['DELETE', '/api/admin/courses/00000000-0000-0000-0000-000000000000']]) {
    const x = await student.j(p, { method: m, json: {} }); ok(x.s === 403, `student ${m} ${p} → 403`, String(x.s)) }
}

section('Admin login')
{
  let r = await admin.j('/api/auth/login', { method: 'POST', json: ADMIN }); ok(r.s === 200 && r.d.role === 'admin', 'admin logs in')
  const o = await admin.t('/admin'); ok(o.s === 200 && o.text.includes('Dashboard overview') && o.text.includes('Registered students'), 'admin overview loads with stats')
  ok((await admin.t('/admin/profile')).s === 200, 'admin profile page loads')
}

section('Uploads: validation')
let thumb, vid, vid2, pdf, pdf2, att
{
  let r = await admin.upload('image', 'thumb.png', PNG); ok(r.s === 200 && r.d.id, 'upload PNG thumbnail'); thumb = r.d
  r = await admin.upload('video', 'lesson1.mp4', MP4); ok(r.s === 200 && r.d.size === MP4.length, 'upload MP4 video'); vid = r.d
  r = await admin.upload('video', 'lesson2.mp4', MP4); vid2 = r.d
  r = await admin.upload('pdf', 'wiring-guide.pdf', PDF); ok(r.s === 200, 'upload PDF book'); pdf = r.d
  r = await admin.upload('pdf', 'nodl.pdf', PDF); pdf2 = r.d
  r = await admin.upload('attachment', 'worksheet.docx', DOCX); ok(r.s === 200, 'upload DOCX attachment'); att = r.d
  r = await admin.upload('pdf', 'virus.exe', Buffer.from('MZ....')); ok(r.s === 400, 'reject .exe')
  r = await admin.upload('pdf', 'fake.pdf', Buffer.from('this is plain text, not a pdf at all')); ok(r.s === 400 && /does not look like/.test(r.d.error), 'reject wrong file content (text named .pdf)')
  r = await admin.upload('video', 'fake.mp4', Buffer.from('hello world, definitely not a video file')); ok(r.s === 400, 'reject fake mp4')
  r = await admin.upload('image', 'big.png', Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)])); ok(r.s === 413, 'reject image over 5 MB (413)', String(r.s))
  r = await admin.upload('nonsense', 'a.pdf', PDF); ok(r.s === 400, 'reject unknown upload kind')
  r = await admin.upload('pdf', '../../etc/passwd.pdf', PDF); ok(r.s === 200 && !r.d.name.includes('/'), 'path traversal in filename neutralised')
  const [f] = await dbq('select stored_name, mime from files where id=$1', [vid.id]); ok(/^[0-9a-f-]{36}\.mp4$/.test(f.stored_name) && f.mime === 'video/mp4', 'stored under random name with server-decided MIME')
}

section('4-7. Courses + videos')
let course, draft
{
  const base = { description: 'Learn safe wiring.\n\nSecond paragraph.', instructorName: 'Eng. Ahmed', level: 'Beginner', duration: '6 weeks' }
  const [cat] = await dbq(`select id from categories where kind='course' and name='Electrical Installation and Wiring'`)
  let r = await admin.j('/api/admin/courses', { method: 'POST', json: { ...base, title: 'Home Wiring Basics', categoryId: cat.id, status: 'published', thumbnailFileId: thumb.id, videos: [{ title: 'Intro', fileId: vid.id }, { title: 'External', url: 'https://youtu.be/dQw4w9WgXcQ' }] } })
  ok(r.s === 200 && r.d.id, 'admin creates published course with thumbnail + video + link', JSON.stringify(r.d)); course = r.d.id
  r = await admin.j('/api/admin/courses', { method: 'POST', json: { ...base, title: 'Secret Draft Course', status: 'draft', videos: [{ title: 'D', fileId: vid2.id }] } }); draft = r.d.id
  r = await admin.j('/api/admin/courses', { method: 'POST', json: { title: 'x' } }); ok(r.s === 400, 'course validation rejects short title')
  r = await admin.j('/api/admin/courses', { method: 'POST', json: { ...base, title: 'Bad ref', videos: [{ title: 'v', fileId: pdf.id }] } }); ok(r.s === 400, 'course rejects a non-video file as video')
  const [row] = await dbq('select c.status, c.thumbnail_file_id, (select count(*)::int from course_videos where course_id=c.id) n from courses c where id=$1', [course])
  ok(row.status === 'published' && row.thumbnail_file_id === thumb.id && row.n === 2, 'DB: course saved with thumbnail and 2 video rows')
  const list = await anon.t('/courses'); ok(list.text.includes('Home Wiring Basics') && !list.text.includes('Secret Draft Course'), 'public /courses lists published only')
  ok((await anon.t('/')).text.includes('Home Wiring Basics'), 'homepage featured courses come from the database')
  ok((await anon.t(`/courses?q=${encodeURIComponent("'; drop table users;--")}`)).s === 200 && (await dbq('select count(*)::int n from users'))[0].n > 0, 'SQL-injection style search is harmless')
  ok((await anon.t('/courses?q=wiring')).text.includes('Home Wiring Basics'), 'course search works')
  ok((await anon.t(`/courses/${draft}`)).s === 404, 'draft course page is 404 for the public')
  const lock = await anon.t(`/courses/${course}`); ok(lock.s === 200 && lock.text.includes('Log in to watch') && !lock.text.includes(`/media/${vid.id}`), 'logged-out visitor sees locked player, no video URL leaked')
  const pg = await student.t(`/courses/${course}`); ok(pg.text.includes(`/media/${vid.id}`) && pg.text.includes('Eng. Ahmed'), 'student sees player with uploaded video + instructor')
  ok((await anon.req(`/media/${vid.id}`)).status === 401, 'video file not accessible when logged out (401)')
  const m = await student.req(`/media/${vid.id}`); const buf = Buffer.from(await m.arrayBuffer()); ok(m.status === 200 && buf.equals(MP4) && m.headers.get('content-type') === 'video/mp4' && m.headers.get('accept-ranges') === 'bytes', 'student downloads full video bytes intact')
  const rg = await student.req(`/media/${vid.id}`, { headers: { range: 'bytes=100-199' } }); const rb = Buffer.from(await rg.arrayBuffer()); ok(rg.status === 206 && rb.length === 100 && rb.equals(MP4.subarray(100, 200)) && rg.headers.get('content-range') === `bytes 100-199/${MP4.length}`, 'Range request → 206 with exact bytes (seeking works)')
  const rg2 = await student.req(`/media/${vid.id}`, { headers: { range: `bytes=${MP4.length + 5}-` } }); ok(rg2.status === 416, 'out-of-range request → 416')
  ok((await student.req(`/media/${vid2.id}`)).status === 404, 'student cannot fetch draft-course video')
  ok((await anon.req(`/media/${thumb.id}`)).status === 200, 'thumbnail is public')
  const en = await student.j(`/api/courses/${course}/enroll`, { method: 'POST' }); ok(en.s === 200, 'student enrols'); ok((await student.t('/dashboard')).text.includes('Home Wiring Basics'), 'enrolled course shows on dashboard')
  ok((await student.j(`/api/courses/${draft}/enroll`, { method: 'POST' })).s === 404, 'cannot enrol in draft course')
  ok((await admin.t(`/admin/courses/${course}`)).text.includes('Home Wiring Basics'), 'admin edit page loads with saved data')
  ok((await admin.t('/admin/courses')).text.includes('Secret Draft Course'), 'admin list shows draft too')
}

section('Publish / unpublish / edit / delete course')
{
  let r = await admin.j(`/api/admin/courses/${course}`, { method: 'PATCH', json: { status: 'draft' } }); ok(r.s === 200, 'unpublish course')
  ok(!(await anon.t('/courses')).text.includes('Home Wiring Basics') && (await anon.t(`/courses/${course}`)).s === 404, 'unpublished course disappears immediately')
  ok((await student.req(`/media/${vid.id}`)).status === 404, 'unpublished course video blocked for students')
  ok((await admin.req(`/media/${vid.id}`)).status === 200, 'admin can still preview it')
  await admin.j(`/api/admin/courses/${course}`, { method: 'PATCH', json: { status: 'published' } })
  // edit: rename, drop the uploaded video (file must be deleted), keep link
  r = await admin.j(`/api/admin/courses/${course}`, { method: 'PUT', json: { title: 'Home Wiring Basics v2', description: 'Updated', instructorName: 'Eng. Ahmed', level: 'Intermediate', duration: '8 weeks', status: 'published', categoryId: null, thumbnailFileId: thumb.id, videos: [{ title: 'External', url: 'https://youtu.be/dQw4w9WgXcQ' }] } })
  ok(r.s === 200, 'edit course')
  ok((await anon.t('/courses')).text.includes('Home Wiring Basics v2'), 'edit is visible immediately')
  const e = await exists(vid.id); ok(!e.row && !e.disk, 'removed video deleted from DB and disk')
  ok((await student.t(`/courses/${course}`)).text.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'YouTube link renders as embedded player')
  r = await admin.j(`/api/admin/courses/${draft}`, { method: 'DELETE' }); ok(r.s === 200, 'delete course')
  const e2 = await exists(vid2.id); ok(!e2.row && !e2.disk, 'deleting a course removes its video file from DB + disk')
  ok((await admin.j(`/api/admin/courses/${draft}`, { method: 'DELETE' })).s === 404, 'deleting twice → 404')
}

section('8-9. Books & documents')
let doc, doc2, docDraft
{
  const [cat] = await dbq(`select id from categories where kind='document' and name='Safety Manuals'`)
  let r = await admin.j('/api/admin/documents', { method: 'POST', json: { title: 'Wiring Regulations Guide', description: 'A practical guide', categoryId: cat.id, fileId: pdf.id, allowDownload: true, status: 'published' } }); ok(r.s === 200, 'admin adds published PDF'); doc = r.d.id
  r = await admin.j('/api/admin/documents', { method: 'POST', json: { title: 'Read-only Manual', description: '', categoryId: null, fileId: pdf2.id, allowDownload: false, status: 'published' } }); doc2 = r.d.id
  r = await admin.upload('pdf', 'draft.pdf', PDF); const dd = r.d
  r = await admin.j('/api/admin/documents', { method: 'POST', json: { title: 'Unreleased Draft Book', description: '', fileId: dd.id, status: 'draft' } }); docDraft = r.d.id
  r = await admin.j('/api/admin/documents', { method: 'POST', json: { title: 'No file here', description: '' } }); ok(r.s === 400, 'document without a file rejected')
  r = await admin.j('/api/admin/documents', { method: 'POST', json: { title: 'Wrong kind', fileId: thumb.id } }); ok(r.s === 400, 'document rejects non-PDF file id')
  const l = await anon.t('/documentation/books'); ok(l.text.includes('Wiring Regulations Guide') && !l.text.includes('Unreleased Draft Book'), 'books list shows published only')
  ok((await anon.t('/documentation/books?category=' + cat.id)).text.includes('Wiring Regulations Guide'), 'category filter works')
  ok((await anon.t('/documentation/books?q=zzzz')).text.includes('Nothing matches'), 'empty search state shown')
  const v = await student.t(`/documentation/books/${doc}`); ok(v.s === 200 && v.text.includes(`/media/${pdf.id}`) && v.text.includes('Download PDF'), 'student opens PDF viewer page')
  ok((await student.t(`/documentation/books/${docDraft}`)).s === 404, 'draft document viewer → 404')
  const f = await student.req(`/media/${pdf.id}`); const fb = Buffer.from(await f.arrayBuffer()); ok(f.status === 200 && f.headers.get('content-type') === 'application/pdf' && fb.equals(PDF) && /^inline/.test(f.headers.get('content-disposition')), 'PDF served inline for reading')
  const dl = await student.req(`/media/${pdf.id}?dl=1`); ok(dl.status === 200 && /^attachment/.test(dl.headers.get('content-disposition')), 'PDF download works when allowed')
  ok((await student.req(`/media/${pdf2.id}?dl=1`)).status === 404, 'download blocked when admin disabled it')
  ok((await student.req(`/media/${pdf2.id}`)).status === 200, '…but reading online still works')
  ok((await student.req(`/media/${dd.id}`)).status === 404, 'draft PDF file not reachable by students')
  ok((await anon.req(`/media/${pdf.id}`)).status === 401, 'PDF requires login')
  r = await admin.j(`/api/admin/documents/${doc}`, { method: 'PUT', json: { title: 'Wiring Regulations Guide 2nd ed', description: 'x', categoryId: cat.id, fileId: pdf.id, allowDownload: true, status: 'published' } }); ok(r.s === 200, 'edit document')
  ok((await student.t('/documentation/books')).text.includes('2nd ed'), 'document edit visible')
  r = await admin.j(`/api/admin/documents/${doc2}`, { method: 'PATCH', json: { status: 'draft' } }); ok(r.s === 200 && !(await anon.t('/documentation/books')).text.includes('Read-only Manual'), 'unpublish document hides it')
  r = await admin.j(`/api/admin/documents/${docDraft}`, { method: 'DELETE' }); ok(r.s === 200, 'delete document'); const ed = await exists(dd.id); ok(!ed.row && !ed.disk, 'document file removed from DB + disk')
}

section('10-11. Daily lessons')
let lessonA, lessonB, lessonDraft, lessonFuture
{
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
  const mk = async (title, status, date, extra = {}) => (await admin.j('/api/admin/lessons', { method: 'POST', json: { title, content: '# Heading\n\nSome **bold** text.\n\n- one\n- two\n\n<script>alert(1)</script>', publishDate: date, status, attachmentIds: [], ...extra } })).d.id
  lessonA = await mk('Older published lesson', 'published', day(-3))
  lessonB = await mk('Newest published lesson', 'published', day(0), { attachmentIds: [att.id] })
  lessonDraft = await mk('Draft lesson hidden', 'draft', day(0))
  lessonFuture = await mk('Scheduled lesson hidden', 'published', day(5))
  ok(lessonA && lessonB, 'admin creates lessons')
  const r = await admin.j('/api/admin/lessons', { method: 'POST', json: { title: 'ab', content: 'x', publishDate: 'tomorrow' } }); ok(r.s === 400, 'lesson validation works')
  const l = await anon.t('/documentation/lessons')
  ok(l.text.includes('Newest published lesson') && l.text.includes('Older published lesson') && !l.text.includes('Draft lesson hidden') && !l.text.includes('Scheduled lesson hidden'), 'lessons list: published only, drafts + future-dated hidden')
  ok(l.text.indexOf('Newest published lesson') < l.text.indexOf('Older published lesson'), 'latest lesson appears first')
  const pg = await student.t(`/documentation/lessons/${lessonB}`)
  ok(pg.s === 200 && pg.text.includes('<h2>Heading</h2>') && pg.text.includes('<strong>bold</strong>') && pg.text.includes('<li>one</li>'), 'lesson reader renders formatting')
  ok(!pg.text.includes('<script>alert(1)') && pg.text.includes('&lt;script&gt;'), 'lesson content is HTML-escaped (no XSS)')
  ok(pg.text.includes('worksheet.docx'), 'lesson shows attachment')
  const af = await student.req(`/media/${att.id}`); ok(af.status === 200 && /^attachment/.test(af.headers.get('content-disposition')), 'student downloads lesson attachment')
  ok((await anon.req(`/documentation/lessons/${lessonB}`)).status === 307, 'lesson reader requires login')
  ok((await student.t(`/documentation/lessons/${lessonDraft}`)).s === 404 && (await student.t(`/documentation/lessons/${lessonFuture}`)).s === 404, 'draft + scheduled lessons 404 for students')
  // publish a draft → immediately visible
  const p = await admin.j(`/api/admin/lessons/${lessonDraft}`, { method: 'PATCH', json: { status: 'published' } }); ok(p.s === 200 && (await student.t(`/documentation/lessons/${lessonDraft}`)).s === 200, 'publishing a draft makes it available immediately')
  const ed = await admin.j(`/api/admin/lessons/${lessonA}`, { method: 'PUT', json: { title: 'Older lesson EDITED', content: 'Edited content here', publishDate: day(-3), status: 'published', attachmentIds: [] } }); ok(ed.s === 200 && (await student.t('/documentation/lessons')).text.includes('Older lesson EDITED'), 'edit lesson')
  const dl = await admin.j(`/api/admin/lessons/${lessonB}`, { method: 'DELETE' }); const ex = await exists(att.id); ok(dl.s === 200 && !ex.row && !ex.disk, 'delete lesson removes its attachment file')
}

section('Students management')
{
  const s = await admin.t('/admin/students'); ok(s.s === 200 && s.text.includes('Mohamed Ali') && s.text.includes('Hodan Farah'), 'admin sees registered students')
  ok(!(await admin.t('/admin/students?q=hodan')).text.includes('Mohamed Ali') && (await admin.t('/admin/students?q=hodan')).text.includes('Hodan Farah'), 'student search works')
  const [u] = await dbq('select id from users where email=$1', [email])
  ok((await admin.t(`/admin/students/${u.id}`)).text.includes('Home Wiring Basics v2'), 'student detail shows enrolments')
  let r = await admin.j(`/api/admin/students/${u.id}`, { method: 'PATCH', json: { active: false } }); ok(r.s === 200, 'deactivate student')
  ok((await student.req('/dashboard')).status === 307, 'deactivated student is logged out immediately')
  r = await new Client().j('/api/auth/login', { method: 'POST', json: { email, password: 'Strong#Pass1' } }); ok(r.s === 403, 'deactivated student cannot log in')
  await admin.j(`/api/admin/students/${u.id}`, { method: 'PATCH', json: { active: true } }); r = await student.j('/api/auth/login', { method: 'POST', json: { email, password: 'Strong#Pass1' } }); ok(r.s === 200, 'reactivated student can log in again')
  const adm = (await dbq(`select id from users where role='admin' limit 1`))[0]; r = await admin.j(`/api/admin/students/${adm.id}`, { method: 'PATCH', json: { active: false } }); ok(r.s === 404, 'student API cannot deactivate an admin account')
  const [{ n }] = await dbq('select count(*)::int n from users'); ok((await admin.j('/api/admin/categories', { method: 'POST', json: { kind: 'course', name: 'Test Category ' + stamp } })).s === 200, 'admin creates category')
  const ap = await admin.j('/api/admin/profile', { method: 'PATCH', json: { fullName: 'Test Admin' } }); ok(ap.s === 200, 'admin profile update')
}

section('21. Persistence across restart (run again with RESTARTED=1)')
fs.writeFileSync('tests/.state.json', JSON.stringify({ course, pdfId: pdf.id, docId: doc, lessonId: lessonA, email, bytes: PDF.length }))
console.log(`\n==== ${pass} passed, ${fail} failed ====`)
await pool.end()
process.exit(fail ? 1 : 0)
