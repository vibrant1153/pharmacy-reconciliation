import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'pharmacy_session',
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getIronSession<{ userId?: string; role?: string }>(
    req,
    res,
    sessionOptions
  )

  const path = req.nextUrl.pathname

  if (!session.userId && (path.startsWith('/dashboard') || path.startsWith('/sales'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session.role === 'EMPLOYEE' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sales', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/sales/:path*'],
}