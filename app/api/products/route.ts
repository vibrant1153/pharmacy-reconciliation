import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Owner access required.' },
      { status: 403 }
    )
  }

  const { name, pricePerStrip, stripsPerCarton, startingCartons, categoryId, subcategoryId } = await req.json()

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
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      batches: {
        create: {
          cartonsAdded: startingCartons,
          remainingStrips: startingCartons * stripsPerCarton,
          status: 'ACTIVE',
        },
      },
    },
    include: { batches: true },
  })

  await logAudit({
    userId: session.userId!,
    action: 'PRODUCT_ADDED',
    entity: 'Product',
    entityId: product.id,
    newValue: `${name} added`,
  })

  return NextResponse.json({ success: true, product })
}

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Login required.' },
      { status: 401 }
    )
  }

  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'

  const products = await prisma.product.findMany({
    where: includeArchived ? {} : { archived: false },
    include: {
      batches: { where: { status: 'ACTIVE' } },
      category: true,
      subcategory: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, products })
}