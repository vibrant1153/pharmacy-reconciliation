import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

function getBounds(period: string) {
  const now = new Date()
  const start = new Date(now)

  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    start.setMonth(now.getMonth() - 1)
  } else {
    start.setFullYear(2000) // effectively "all time"
  }

  return { start, end: now }
}

export async function GET(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const period = req.nextUrl.searchParams.get('period') || 'today'
  const { start, end } = getBounds(period)

  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: { createdAt: { gte: start, lte: end }, voided: false },
    },
    include: {
      sale: { include: { employee: { select: { name: true } } } },
      batch: { include: { product: { include: { category: true } } } },
    },
  })

  let totalProfit = 0
  let totalRevenue = 0
  const byMedicine: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  const byEmployee: Record<string, number> = {}

  for (const item of saleItems) {
    const profit = Number(item.profit)
    const revenue = Number(item.pricePerUnit) * item.quantitySold
    totalProfit += profit
    totalRevenue += revenue

    const productName = item.batch.product.name
    byMedicine[productName] = (byMedicine[productName] || 0) + profit

    const categoryName = item.batch.product.category?.name || 'Uncategorized'
    byCategory[categoryName] = (byCategory[categoryName] || 0) + profit

    const employeeName = item.sale.employee.name
    byEmployee[employeeName] = (byEmployee[employeeName] || 0) + profit
  }

  return NextResponse.json({
    success: true,
    period,
    totalProfit,
    totalRevenue,
    byMedicine: Object.entries(byMedicine).map(([name, profit]) => ({ name, profit })).sort((a, b) => b.profit - a.profit),
    byCategory: Object.entries(byCategory).map(([name, profit]) => ({ name, profit })).sort((a, b) => b.profit - a.profit),
    byEmployee: Object.entries(byEmployee).map(([name, profit]) => ({ name, profit })).sort((a, b) => b.profit - a.profit),
  })
}