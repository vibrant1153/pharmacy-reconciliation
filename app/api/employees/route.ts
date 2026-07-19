import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: { id: true, username: true, name: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, employees })
}

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { name, username, pin } = await req.json()

  if (!name || !username || !pin || pin.length < 4) {
    return NextResponse.json({ success: false, message: 'Name, username, and a PIN (min 4 digits) are required.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ success: false, message: 'That username is already taken.' }, { status: 400 })
  }

  const hashedPin = await bcrypt.hash(pin, 10)

  const employee = await prisma.user.create({
    data: { name, username, pin: hashedPin, role: 'EMPLOYEE' },
  })

  await logAudit({
    userId: session.userId!,
    action: 'EMPLOYEE_ADDED',
    entity: 'User',
    entityId: employee.id,
    newValue: `${name} (${username})`,
  })

  return NextResponse.json({ success: true, employee: { id: employee.id, name: employee.name, username: employee.username } })
}