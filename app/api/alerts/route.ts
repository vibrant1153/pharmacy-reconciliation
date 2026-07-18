import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { runAlertChecks } from '@/lib/alerts'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  await runAlertChecks()

  const alerts = await prisma.alert.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, alerts })
}