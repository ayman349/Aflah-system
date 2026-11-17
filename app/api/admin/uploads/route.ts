import { handler } from '@/lib/http'
import { apiAdmin } from '@/lib/auth'
import { saveUpload } from '@/lib/storage'

// Raw streaming upload: body = the file bytes, header x-filename. Streams straight to disk (no memory buffering).
export const POST = handler(async req => {
  const admin = await apiAdmin()
  const url = new URL(req.url)
  const len = Number(req.headers.get('content-length'))
  return saveUpload({
    kind: url.searchParams.get('kind') ?? '',
    filename: decodeURIComponent(req.headers.get('x-filename') ?? ''),
    body: req.body, contentLength: len > 0 ? len : null, userId: admin.id,
  })
})
