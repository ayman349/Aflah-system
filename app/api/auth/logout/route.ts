import { NextResponse } from 'next/server'
import { handler } from '@/lib/http'
import { destroySession } from '@/lib/auth'

export const POST = handler(async req => {
  await destroySession()
  const base = process.env.APP_URL || new URL(req.url).origin
  return NextResponse.redirect(new URL('/', base), 303)
})
