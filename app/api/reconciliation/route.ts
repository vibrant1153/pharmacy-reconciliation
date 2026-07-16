import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

function getDateBounds(dateStr: string) {
  const start = new Date(dateStr)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function GET(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const dateParam = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]
  const { start, end } = getDateBounds(dateParam)

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end }, voided: false },
    include: { items: { include: { batch: { include: { product: true } } } } },
  })

  const byProduct: Record<string, { name: string; expectedRevenue: number }> = {}
  let totalExpectedRevenue = 0

  for (const sale of sales) {
    for (const item of sale.items) {
      const productId = item.productId
      const productName = item.batch.product.name
      const revenue = item.quantity * Number(item.pricePerStrip)

      if (!byProduct[productId]) {
        byProduct[productId] = { name: productName, expectedRevenue: 0 }
      }
      byProduct[productId].expectedRevenue += revenue
      totalExpectedRevenue += revenue
    }
  }

  const existing = await prisma.dailyReconciliation.findUnique({
    where: { date: start },
  })

  const actualCash = existing ? Number(existing.actualCash) : null
  const diff = actualCash !== null ? actualCash - totalExpectedRevenue : null

  let status: 'green' | 'yellow' | 'red' | 'pending' = 'pending'
  if (diff !== null) {
    const absDiff = Math.abs(diff)
    if (absDiff === 0) status = 'green'
    else if (absDiff <= 50) status = 'yellow' // temporary hardcoded threshold; Stage 12 (Settings) makes this configurable
    else status = 'red'
  }

  return NextResponse.json({
    success: true,
    date: dateParam,
    products: Object.values(byProduct),
    totalExpectedRevenue,
    actualCash,
    diff,
    status,
  })
}