import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { baseUnitsPerLevel } from '@/lib/packaging'

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Login required.' }, { status: 401 })
  }

  const { productId, packagingLevelId, quantity } = await req.json()

  if (!productId || !packagingLevelId || !quantity || quantity <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid sale.' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { packagingLevels: true },
  })

  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 })
  }

  const level = product.packagingLevels.find((l) => l.id === packagingLevelId)
  if (!level || !level.isSellable || level.price === null) {
    return NextResponse.json({ success: false, message: 'This packaging level is not sellable.' }, { status: 400 })
  }

  const batch = await prisma.batch.findFirst({
    where: { productId, status: 'ACTIVE' },
  })

  if (!batch) {
    return NextResponse.json({ success: false, message: 'No active stock for this product.' }, { status: 400 })
  }

  const unitsPerLevel = baseUnitsPerLevel(product.packagingLevels, level.order)
  const baseUnitsConsumed = unitsPerLevel * quantity

  if (batch.remainingBaseUnits < baseUnitsConsumed) {
    return NextResponse.json({ success: false, message: 'Not enough stock.' }, { status: 400 })
  }

  const pricePerUnit = level.price
  const total = Number(pricePerUnit) * quantity

  const result = await prisma.$transaction(async (tx) => {
    const newRemaining = batch.remainingBaseUnits - baseUnitsConsumed

    const sale = await tx.sale.create({
      data: {
        employeeId: session.userId!,
        total,
        items: {
          create: {
            batchId: batch.id,
            productId,
            packagingLevelId,
            quantitySold: quantity,
            baseUnitsConsumed,
            pricePerUnit,
          },
        },
      },
      include: { items: true },
    })

    if (newRemaining === 0) {
      // expectedRevenue uses the price of the level that this batch's base units were opened as —
      // simplest consistent approach: value the whole batch at whichever level was actually sold.
      // Good enough for MVP; a batch sold via mixed levels would need a smarter valuation later.
      const expectedRevenue = (batch.totalBaseUnits / unitsPerLevel) * Number(pricePerUnit)

      await tx.batch.update({
        where: { id: batch.id },
        data: {
          remainingBaseUnits: 0,
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
        data: { remainingBaseUnits: newRemaining },
      })
    }

    return sale
  })

  await logAudit({
    userId: session.userId!,
    action: 'SOLD',
    entity: 'Sale',
    entityId: result.id,
    newValue: `${quantity} x ${level.name} of ${product.name} = ${total} Birr`,
  })

  return NextResponse.json({ success: true, sale: result })
}