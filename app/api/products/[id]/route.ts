import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const { name } = await req.json()

  if (!name || !name.trim()) {
    return NextResponse.json({ success: false, message: 'Name cannot be empty.' }, { status: 400 })
  }

  const before = await prisma.product.findUnique({ where: { id } })

  const product = await prisma.product.update({
    where: { id },
    data: { name: name.trim() },
  })

  await logAudit({
    userId: session.userId!,
    action: 'PRODUCT_RENAMED',
    entity: 'Product',
    entityId: id,
    oldValue: before?.name,
    newValue: product.name,
  })

  return NextResponse.json({ success: true, product })
}