import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Login required.' }, { status: 401 })
  }

  const { productId, quantity } = await req.json()

  if (!productId || !quantity || quantity <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid sale.' }, { status: 400 })
  }

  const batch = await prisma.batch.findFirst({
    where: { productId, status: 'ACTIVE' },
    include: { product: true },
  })

  if (!batch) {
    return NextResponse.json({ success: false, message: 'No active stock for this product.' }, { status: 400 })
  }

  if (batch.remainingStrips < quantity) {
    return NextResponse.json({ success: false, message: 'Not enough stock.' }, { status: 400 })
  }

  const pricePerStrip = batch.product.pricePerStrip
  const total = Number(pricePerStrip) * quantity

  const result = await prisma.$transaction(async (tx) => {
    const newRemaining = batch.remainingStrips - quantity

    const sale = await tx.sale.create({
      data: {
        employeeId: session.userId!,
        total,
        items: {
          create: {
            batchId: batch.id,
            productId,
            quantity,
            pricePerStrip,
          },
        },
      },
      include: { items: true },
    })

    if (newRemaining === 0) {
      const expectedRevenue = batch.cartonsAdded * batch.product.stripsPerCarton * Number(pricePerStrip)

      await tx.batch.update({
        where: { id: batch.id },
        data: {
          remainingStrips: 0,
          status: 'COMPLETED',
          closedAt: new Date(),
          expectedRevenue,
        },
      })

      const nextBatch = await tx.batch.findFirst({
        where: { productId, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      })

      if (nextBatch) {
        await tx.batch.update({
          where: { id: nextBatch.id },
          data: { status: 'ACTIVE' },
        })
      }
    } else {
      await tx.batch.update({
        where: { id: batch.id },
        data: { remainingStrips: newRemaining },
      })
    }

    return sale
  })

  await logAudit({
    userId: session.userId!,
    action: 'SOLD',
    entity: 'Sale',
    entityId: result.id,
    newValue: `${quantity} x ${batch.product.name} = ${total} Birr`,
  })

  return NextResponse.json({ success: true, sale: result })
}