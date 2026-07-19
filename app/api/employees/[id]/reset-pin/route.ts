import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const { pin } = await req.json()

  if (!pin || pin.length < 4) {
    return NextResponse.json({ success: false, message: 'PIN must be at least 4 digits.' }, { status: 400 })
  }

  const employee = await prisma.user.findUnique({ where: { id } })
  if (!employee || employee.role !== 'EMPLOYEE') {
    return NextResponse.json({ success: false, message: 'Employee not found.' }, { status: 404 })
  }

  const hashedPin = await bcrypt.hash(pin, 10)
  await prisma.user.update({ where: { id }, data: { pin: hashedPin } })

  await logAudit({
    userId: session.userId!,
    action: 'PIN_RESET',
    entity: 'User',
    entityId: id,
    newValue: `PIN reset for ${employee.name}`,
  })

  return NextResponse.json({ success: true })
}