import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { q, q1 } from './db'
import { HttpError } from './http'

export type FileKind = 'video' | 'image' | 'pdf' | 'attachment'
const mb = (env: string | undefined, d: number) => (Number(env) > 0 ? Number(env) : d) * 1024 * 1024

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || './storage')
const MIME: Record<string, string> = {
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip',
}
const rules = (): Record<FileKind, { exts: string[]; max: number }> => ({
  video: { exts: ['mp4', 'm4v', 'webm', 'ogv'], max: mb(process.env.MAX_VIDEO_MB, 500) },
  image: { exts: ['jpg', 'jpeg', 'png', 'webp'], max: mb(process.env.MAX_IMAGE_MB, 5) },
  pdf: { exts: ['pdf'], max: mb(process.env.MAX_PDF_MB, 50) },
  attachment: { exts: ['pdf', 'docx', 'pptx', 'xlsx', 'zip', 'jpg', 'jpeg', 'png'], max: mb(process.env.MAX_ATTACHMENT_MB, 25) },
})

// The real file content must match the extension (stops e.g. an .exe renamed to .pdf).
function magicOk(ext: string, h: Buffer) {
  const s = (a: number, b: number) => h.subarray(a, b).toString('latin1')
  switch (ext) {
    case 'mp4': case 'm4v': return s(4, 8) === 'ftyp'
    case 'webm': return h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3
    case 'ogv': return s(0, 4) === 'OggS'
    case 'jpg': case 'jpeg': return h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff
    case 'png': return h[0] === 0x89 && s(1, 4) === 'PNG'
    case 'webp': return s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP'
    case 'pdf': return s(0, 5) === '%PDF-'
    default: return s(0, 2) === 'PK' // docx / pptx / xlsx / zip
  }
}

export async function saveUpload(opts: { kind: string; filename: string; body: ReadableStream | null; contentLength: number | null; userId: string }) {
  const R = rules()
  if (!(opts.kind in R)) throw new HttpError(400, 'Unknown upload type')
  const kind = opts.kind as FileKind, rule = R[kind]
  const original = path.basename(opts.filename || '').replace(/[^\w.\- ()]/g, '_').slice(0, 150)
  const ext = path.extname(original).slice(1).toLowerCase()
  if (!rule.exts.includes(ext)) throw new HttpError(400, `Not an allowed file type. Allowed: ${rule.exts.join(', ')}`)
  const limitMsg = `File is too large (max ${Math.round(rule.max / 1024 / 1024)} MB for this type)`
  if (opts.contentLength && opts.contentLength > rule.max) throw new HttpError(413, limitMsg)
  if (!opts.body) throw new HttpError(400, 'No file received')

  await fsp.mkdir(uploadDir(), { recursive: true })
  const stored = `${crypto.randomUUID()}.${ext}`
  const dest = path.join(uploadDir(), stored)
  const out = fs.createWriteStream(dest, { flags: 'wx', mode: 0o640 })
  let size = 0, head = Buffer.alloc(0), checked = false
  const fail = async (e: HttpError) => { out.destroy(); await fsp.unlink(dest).catch(() => {}); throw e }
  try {
    for await (const chunk of Readable.fromWeb(opts.body as any) as AsyncIterable<Buffer>) {
      size += chunk.length
      if (size > rule.max) return await fail(new HttpError(413, limitMsg))
      if (!checked) {
        head = Buffer.concat([head, chunk])
        if (head.length >= 16) { if (!magicOk(ext, head)) return await fail(new HttpError(400, `File content does not look like a real .${ext} file`)); checked = true }
      }
      if (!out.write(chunk)) await new Promise<void>(r => out.once('drain', () => r()))
    }
    if (!checked && !magicOk(ext, head)) return await fail(new HttpError(400, `File content does not look like a real .${ext} file`))
    if (size === 0) return await fail(new HttpError(400, 'The file is empty'))
    await new Promise<void>((res, rej) => out.end((e: any) => (e ? rej(e) : res())))
  } catch (e) {
    out.destroy(); await fsp.unlink(dest).catch(() => {})
    if (e instanceof HttpError) throw e
    throw new HttpError(400, 'Upload interrupted. Please try again.')
  }
  const row = await q1(
    `insert into files(kind, original_name, stored_name, mime, size_bytes, uploaded_by) values($1,$2,$3,$4,$5,$6) returning id, original_name, size_bytes`,
    [kind, original, stored, MIME[ext], size, opts.userId])
  return { id: row.id as string, name: row.original_name as string, size: Number(row.size_bytes) }
}

/** Remove DB rows and the bytes on disk. Call after the rows that reference the files are gone. */
export async function deleteFiles(ids: (string | null | undefined)[]) {
  const list = ids.filter(Boolean) as string[]
  if (!list.length) return
  const rows = await q<{ stored_name: string }>('delete from files where id = any($1::uuid[]) returning stored_name', [list])
  await Promise.all(rows.map(r => fsp.unlink(path.join(uploadDir(), r.stored_name)).catch(() => {})))
}
