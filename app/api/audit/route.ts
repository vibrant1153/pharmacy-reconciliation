import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { timestamp: 'desc' },
    take: 200,
  })

  const formatted = logs.map((log) => ({
    id: log.id,
    userName: log.user.name,
    action: log.action,
    entity: log.entity,
    oldValue: log.oldValue,
    newValue: log.newValue,
    timestamp: log.timestamp,
  }))

  return NextResponse.json({ success: true, logs: formatted })
}