import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Login required.' }, { status: 401 })
  }

  const { id } = await params

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!sale || sale.voided) {
    return NextResponse.json({ success: false, message: 'Sale not found or already undone.' }, { status: 400 })
  }

  const isOwner = session.role === 'OWNER'
  const isOwnSale = sale.employeeId === session.userId

  if (!isOwner && !isOwnSale) {
    return NextResponse.json({ success: false, message: 'You can only undo your own sales.' }, { status: 403 })
  }

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.batch.update({
        where: { id: item.batchId },
        data: { remainingBaseUnits: { increment: item.baseUnitsConsumed } },
      })
    }
    await tx.sale.update({ where: { id }, data: { voided: true } })
  })

  await logAudit({
    userId: session.userId!,
    action: 'SALE_UNDONE',
    entity: 'Sale',
    entityId: id,
    oldValue: `total: ${sale.total}`,
    newValue: 'voided',
  })

  return NextResponse.json({ success: true })
}