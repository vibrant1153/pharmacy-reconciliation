import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, pin } = await req.json()

  if (!username || !pin) {
    return NextResponse.json(
      { success: false, message: 'Username and PIN are required.' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || !(await bcrypt.compare(pin, user.pin))) {
    return NextResponse.json(
      { success: false, message: 'Invalid username or PIN.' },
      { status: 401 }
    )
  }

  const session = await getSession()
  session.userId = user.id
  session.role = user.role
  session.name = user.name
  await session.save()

  return NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, role: user.role },
  })
}