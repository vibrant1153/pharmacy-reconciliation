import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const settings = await getSettings()
  return NextResponse.json({ success: true, settings })
}

export async function PATCH(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const body = await req.json()
  const current = await getSettings()

  const updated = await prisma.settings.update({
    where: { id: current.id },
    data: {
      lowStockThreshold: body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold) : undefined,
      discrepancyThreshold: body.discrepancyThreshold !== undefined ? parseFloat(body.discrepancyThreshold) : undefined,
      staleItemMultiplier: body.staleItemMultiplier !== undefined ? parseFloat(body.staleItemMultiplier) : undefined,
    },
  })

  await logAudit({
    userId: session.userId!,
    action: 'SETTINGS_UPDATED',
    entity: 'Settings',
    entityId: updated.id,
    newValue: `lowStock:${updated.lowStockThreshold}, discrepancy:${updated.discrepancyThreshold}, staleMultiplier:${updated.staleItemMultiplier}`,
  })

  return NextResponse.json({ success: true, settings: updated })
}