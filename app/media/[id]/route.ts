import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { getUser } from '@/lib/auth'
import { q1, isUuid } from '@/lib/db'
import { uploadDir } from '@/lib/storage'

export const dynamic = 'force-dynamic'
const text = (s: string, status: number) => new Response(s, { status })

// Authenticated file delivery. Files are NOT in /public: access is decided here, per request, from the database.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return text('Not found', 404)
  const f = await q1('select id, kind, original_name, stored_name, mime, size_bytes from files where id=$1', [params.id])
  if (!f) return text('Not found', 404)
  const dl = new URL(req.url).searchParams.get('dl') === '1'

  if (f.kind !== 'image') { // thumbnails are public; everything else needs a login
    const u = await getUser()
    if (!u) return text('Please log in', 401)
    if (u.role !== 'admin') {
      let allowed = false
      if (f.kind === 'video')
        allowed = !!(await q1(`select 1 from course_videos v join courses c on c.id=v.course_id where v.file_id=$1 and c.status='published'`, [f.id]))
      else if (f.kind === 'pdf') {
        const d = await q1(`select allow_download from documents where file_id=$1 and status='published'`, [f.id])
        allowed = !!d && (!dl || d.allow_download)
      } else
        allowed = !!(await q1(`select 1 from lesson_attachments a join daily_lessons l on l.id=a.lesson_id where a.file_id=$1 and l.status='published' and l.publish_date <= current_date`, [f.id]))
      if (!allowed) return text('Not found', 404)
    }
  }

  const full = path.join(uploadDir(), f.stored_name)
  const size = Number(f.size_bytes)
  let start = 0, end = size - 1, status = 200
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '')
  if (range && (range[1] || range[2])) {
    if (range[1]) { start = Number(range[1]); if (range[2]) end = Math.min(Number(range[2]), size - 1) }
    else { start = Math.max(size - Number(range[2]), 0) }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
    status = 206
  }
  if (!fs.existsSync(full)) return text('File missing on server', 404)
  const safeName = f.original_name.replace(/[^\w.\- ()]/g, '_')
  const inline = !dl && f.kind !== 'attachment'
  const body = Readable.toWeb(fs.createReadStream(full, { start, end })) as unknown as ReadableStream
  return new Response(body, {
    status,
    headers: {
      'Content-Type': f.mime, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes',
      ...(status === 206 ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
      ...(f.kind === 'pdf' ? {} : { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" }), // sandbox would break Chrome's PDF viewer
      'Cache-Control': f.kind === 'image' ? 'public, max-age=3600' : 'private, no-store',
    },
  })
}
