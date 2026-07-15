import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const { cartons } = await req.json()

  if (!cartons || cartons <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid carton count.' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 })
  }

  const hasActive = await prisma.batch.findFirst({ where: { productId: id, status: 'ACTIVE' } })

  const batch = await prisma.batch.create({
    data: {
      productId: id,
      cartonsAdded: cartons,
      remainingStrips: cartons * product.stripsPerCarton,
      status: hasActive ? 'PENDING' : 'ACTIVE',
    },
  })

  return NextResponse.json({ success: true, batch })
}