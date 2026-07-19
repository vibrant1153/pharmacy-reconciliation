import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'

const STALE_ITEM_REMAINING_FRACTION = 0.1 // structural constant, not owner-configurable

export async function runAlertChecks() {
  const settings = await getSettings()
  await checkLowStock(settings.lowStockThreshold)
  await checkDiscrepancies(Number(settings.discrepancyThreshold))
  await checkStaleItems(Number(settings.staleItemMultiplier))
}

async function checkLowStock(threshold: number) {
  const activeBatches = await prisma.batch.findMany({
    where: { status: 'ACTIVE' },
    include: { product: true },
  })

  for (const batch of activeBatches) {
    if (batch.remainingBaseUnits > 0 && batch.remainingBaseUnits <= threshold) {
      const alreadyOpen = await prisma.alert.findFirst({
        where: { type: 'LOW_STOCK', status: 'OPEN', productId: batch.productId },
      })
      if (!alreadyOpen) {
        await prisma.alert.create({
          data: {
            type: 'LOW_STOCK',
            productId: batch.productId,
            batchId: batch.id,
            message: `${batch.product.name} is low on stock (${batch.remainingBaseUnits} base units left).`,
          },
        })
      }
    }
  }
}

async function checkDiscrepancies(threshold: number) {
  const recons = await prisma.dailyReconciliation.findMany({
    orderBy: { date: 'desc' },
    take: 14,
  })

  for (const recon of recons) {
    const start = new Date(recon.date)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end }, voided: false },
    })
    const expectedRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
    const diff = Number(recon.actualCash) - expectedRevenue
    const dateKey = recon.date.toISOString().split('T')[0]

    if (Math.abs(diff) > threshold) {
      const alreadyOpen = await prisma.alert.findFirst({
        where: { type: 'DISCREPANCY', status: 'OPEN', message: { contains: dateKey } },
      })
      if (!alreadyOpen) {
        await prisma.alert.create({
          data: {
            type: 'DISCREPANCY',
            message: `Cash discrepancy of ${diff.toFixed(2)} Birr on ${dateKey}.`,
          },
        })
      }
    }
  }
}

async function checkStaleItems(multiplier: number) {
  const activeBatches = await prisma.batch.findMany({
    where: { status: 'ACTIVE' },
    include: { product: true, saleItems: { include: { sale: true } } },
  })

  for (const batch of activeBatches) {
    const remainingFraction = batch.remainingBaseUnits / batch.totalBaseUnits
    if (remainingFraction > STALE_ITEM_REMAINING_FRACTION) continue

    const saleTimes = batch.saleItems
      .filter((si) => !si.sale.voided)
      .map((si) => si.sale.createdAt.getTime())
      .sort((a, b) => a - b)

    if (saleTimes.length < 2) continue

    const gaps: number[] = []
    for (let i = 1; i < saleTimes.length; i++) gaps.push(saleTimes[i] - saleTimes[i - 1])
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

    const timeSinceLastSale = Date.now() - saleTimes[saleTimes.length - 1]

    if (timeSinceLastSale > avgGap * multiplier) {
      const alreadyOpen = await prisma.alert.findFirst({
        where: { type: 'STALE_ITEM', status: 'OPEN', batchId: batch.id },
      })
      if (!alreadyOpen) {
        await prisma.alert.create({
          data: {
            type: 'STALE_ITEM',
            productId: batch.productId,
            batchId: batch.id,
            message: `${batch.product.name}'s last ${batch.remainingBaseUnits} unit(s) haven't sold in unusually long compared to its normal pace — worth checking.`,
          },
        })
      }
    }
  }
}