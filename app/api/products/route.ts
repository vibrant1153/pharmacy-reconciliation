import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name, categoryId, subcategoryId,
    boxName, boxPrice, boxPurchasePrice, boxSellable,
    stripName, stripsPerBox, stripPrice, stripSellable,
    tabletName, tabletsPerStrip, tabletPrice, tabletSellable,
    startingBoxes,
  } = body

  if (!name || !stripsPerBox || !tabletsPerStrip || !startingBoxes || !boxPurchasePrice) {
    return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 })
  }

  const totalBaseUnits = startingBoxes * stripsPerBox * tabletsPerStrip

  const product = await prisma.product.create({
    data: {
      name,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      packagingLevels: {
        create: [
          {
            name: boxName || 'Box', order: 0, quantityInParent: null,
            isSellable: !!boxSellable, isBaseUnit: false,
            price: boxSellable ? boxPrice : null,
            purchasePrice: boxPurchasePrice,
          },
          {
            name: stripName || 'Strip', order: 1, quantityInParent: stripsPerBox,
            isSellable: !!stripSellable, isBaseUnit: false,
            price: stripSellable ? stripPrice : null,
            purchasePrice: null,
          },
          {
            name: tabletName || 'Tablet', order: 2, quantityInParent: tabletsPerStrip,
            isSellable: !!tabletSellable, isBaseUnit: true,
            price: tabletSellable ? tabletPrice : null,
            purchasePrice: null,
          },
        ],
      },
      batches: {
        create: {
          cartonsAdded: startingBoxes,
          totalBaseUnits,
          remainingBaseUnits: totalBaseUnits,
          status: 'ACTIVE',
        },
      },
    },
    include: { packagingLevels: true, batches: true },
  })

  await logAudit({
    userId: session.userId!,
    action: 'PRODUCT_ADDED',
    entity: 'Product',
    entityId: product.id,
    newValue: `${name} added with 3-level packaging`,
  })

  return NextResponse.json({ success: true, product })
}

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Login required.' }, { status: 401 })
  }

  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'
  const isOwner = session.role === 'OWNER'

  const products = await prisma.product.findMany({
    where: includeArchived ? {} : { archived: false },
    include: {
      packagingLevels: isOwner
        ? { orderBy: { order: 'asc' } }
        : { orderBy: { order: 'asc' }, omit: { purchasePrice: true } },
      batches: { where: { status: 'ACTIVE' } },
      category: true,
      subcategory: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, products })
}