import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'pharmacy_session',
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getIronSession<{ userId?: string; role?: string }>(req, res, sessionOptions)
  const path = req.nextUrl.pathname

  const protectedPaths = ['/dashboard', '/sales', '/products', '/history', '/audit', '/reconciliation', '/alerts']
  const ownerOnlyPaths = ['/dashboard', '/products', '/audit', '/reconciliation', '/alerts']

  if (!session.userId && protectedPaths.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session.role === 'EMPLOYEE' && ownerOnlyPaths.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/sales', req.url))
  }
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/sales/:path*', '/products/:path*', '/history/:path*', '/audit/:path*', '/reconciliation/:path*', '/alerts/:path*'],
}