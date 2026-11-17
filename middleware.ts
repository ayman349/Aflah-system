import { NextResponse, type NextRequest } from 'next/server'

// Fast pre-check only: no cookie -> go to login. Real authorisation (session + role) is enforced
// server-side in every page layout and API route, so this is a convenience, not the security boundary.
export function middleware(req: NextRequest) {
  if (!req.cookies.get('aflax_session')) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] }
