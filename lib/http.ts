import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) { super(message) }
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite=Lax cookies). */
function checkOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) { if (req.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'Cross-site request blocked'); return }
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  let ok = false
  try { ok = new URL(origin).host === host } catch {}
  if (!ok && process.env.APP_URL) { try { ok = new URL(origin).host === new URL(process.env.APP_URL).host } catch {} }
  if (!ok) throw new HttpError(403, 'Cross-site request blocked')
}

type Ctx = { params: Record<string, string> }
export function handler(fn: (req: Request, ctx: Ctx) => Promise<Response | object>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') checkOrigin(req)
      const r = await fn(req, ctx)
      return r instanceof Response ? r : NextResponse.json(r)
    } catch (e: any) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, fields: e.fields }, { status: e.status })
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {}
        for (const i of e.issues) fields[String(i.path[0] ?? 'form')] ??= i.message
        return NextResponse.json({ error: Object.values(fields)[0] ?? 'Invalid input', fields }, { status: 400 })
      }
      if (e?.code === '23505') return NextResponse.json({ error: 'That value already exists.' }, { status: 409 })
      if (e?.code === '22P02' || e?.code === '23503') return NextResponse.json({ error: 'Invalid reference.' }, { status: 400 })
      console.error('[api error]', e)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  }
}

export async function json<T = any>(req: Request): Promise<T> {
  try { return await req.json() } catch { throw new HttpError(400, 'Invalid request body') }
}
