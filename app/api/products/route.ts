import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Owner access required.' },
      { status: 403 }
    )
  }

  const { name, pricePerStrip, stripsPerCarton, startingCartons } = await req.json()

  if (!name || !pricePerStrip || !stripsPerCarton || !startingCartons) {
    return NextResponse.json(
      { success: false, message: 'All fields are required.' },
      { status: 400 }
    )
  }

  const product = await prisma.product.create({
    data: {
      name,
      pricePerStrip,
      stripsPerCarton,
      batches: {
        create: {
          cartonsAdded: startingCartons,
          remainingStrips: startingCartons * stripsPerCarton,
        },
      },
    },
    include: { batches: true },
  })

  return NextResponse.json({ success: true, product })
}

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Owner access required.' },
      { status: 403 }
    )
  }

  const products = await prisma.product.findMany({
    where: { archived: false },
    include: { batches: { where: { status: 'ACTIVE' } } },
  })

  return NextResponse.json({ success: true, products })
}