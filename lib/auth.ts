import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId?: string
  role?: 'OWNER' | 'EMPLOYEE'
  name?: string
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'pharmacy_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

// Call this at the top of any protected API route.
// Returns the session if valid, or null if not logged in.
export async function requireAuth() {
  const session = await getSession()
  if (!session.userId) return null
  return session
}

// Call this in owner-only API routes.
export async function requireOwner() {
  const session = await requireAuth()
  if (!session || session.role !== 'OWNER') return null
  return session
}