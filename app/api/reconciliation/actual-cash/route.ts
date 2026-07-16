import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { date, actualCash } = await req.json()

  if (!date || actualCash === undefined || actualCash < 0) {
    return NextResponse.json({ success: false, message: 'Valid date and cash amount required.' }, { status: 400 })
  }

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  const existing = await prisma.dailyReconciliation.findUnique({ where: { date: dateOnly } })

  const record = await prisma.dailyReconciliation.upsert({
    where: { date: dateOnly },
    update: { actualCash },
    create: { date: dateOnly, actualCash },
  })

  await logAudit({
    userId: session.userId!,
    action: existing ? 'RECONCILIATION_UPDATED' : 'RECONCILIATION_SUBMITTED',
    entity: 'DailyReconciliation',
    entityId: record.id,
    oldValue: existing ? String(existing.actualCash) : undefined,
    newValue: String(actualCash),
  })

  return NextResponse.json({ success: true, record })
}