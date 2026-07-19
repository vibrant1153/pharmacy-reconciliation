import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const settings = await getSettings()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const todaySales = await prisma.sale.findMany({
    where: { createdAt: { gte: startOfToday }, voided: false },
    include: { items: true, employee: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const todaySalesCount = todaySales.length
  const todayExpectedRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0)

  const products = await prisma.product.findMany({
    where: { archived: false },
    include: { batches: { where: { status: 'ACTIVE' } } },
  })

  const lowStock = products
    .filter((p) => {
      const remaining = p.batches[0]?.remainingBaseUnits ?? 0
      return remaining > 0 && remaining <= settings.lowStockThreshold
    })
    .map((p) => ({ name: p.name, remaining: p.batches[0]?.remainingBaseUnits ?? 0 }))

  const outOfStock = products
    .filter((p) => p.batches.length === 0)
    .map((p) => ({ name: p.name }))

  const recentActivity = todaySales.slice(0, 10).map((sale) => ({
    employeeName: sale.employee.name,
    itemCount: sale.items.reduce((sum, i) => sum + i.quantitySold, 0),
    total: Number(sale.total),
    time: sale.createdAt,
  }))

  return NextResponse.json({
    success: true,
    todaySalesCount,
    todayExpectedRevenue,
    lowStock,
    outOfStock,
    recentActivity,
  })
}