import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Login required.' }, { status: 401 })
  }

  const isOwner = session.role === 'OWNER'

  const sales = await prisma.sale.findMany({
    where: isOwner ? {} : { employeeId: session.userId },
    include: {
      employee: { select: { name: true } },
      items: { include: { batch: { include: { product: true } }, packagingLevel: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const formatted = sales.map((sale) => ({
    id: sale.id,
    employeeName: sale.employee.name,
    total: Number(sale.total),
    voided: sale.voided,
    createdAt: sale.createdAt,
    items: sale.items.map((item) => ({
      productName: item.batch.product.name,
      quantity: item.quantitySold,
      pricePerStrip: Number(item.pricePerUnit),
      levelName: item.packagingLevel.name,
    })),
  }))

  return NextResponse.json({ success: true, sales: formatted })
}