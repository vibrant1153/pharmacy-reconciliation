import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session.userId) {
    return NextResponse.json({ success: false }, { status: 401 })
  }
  return NextResponse.json({ success: true, name: session.name, role: session.role })
}