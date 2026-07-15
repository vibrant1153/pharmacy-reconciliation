import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

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

    await tx.batch.update({
      where: { id: batch.id },
      data: { remainingStrips: newRemaining },
    })

    // Stage 4 will add auto-closure logic here. For now, batch just decrements.

    return sale
  })

  return NextResponse.json({ success: true, sale: result })
}