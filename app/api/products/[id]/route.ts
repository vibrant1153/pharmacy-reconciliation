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
  const body = await req.json()

  const before = await prisma.product.findUnique({ where: { id } })
  if (!before) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  const changes: string[] = []

  if (body.name !== undefined && body.name.trim() && body.name.trim() !== before.name) {
    data.name = body.name.trim()
    changes.push(`name: ${before.name} → ${body.name.trim()}`)
  }

  if (body.pricePerStrip !== undefined && Number(body.pricePerStrip) !== Number(before.pricePerStrip)) {
    data.pricePerStrip = body.pricePerStrip
    changes.push(`price: ${before.pricePerStrip} → ${body.pricePerStrip}`)
  }

  if (body.categoryId !== undefined) {
    data.categoryId = body.categoryId || null
  }

  if (body.subcategoryId !== undefined) {
    data.subcategoryId = body.subcategoryId || null
  }

  if (body.archived !== undefined) {
    data.archived = body.archived
    changes.push(body.archived ? 'archived' : 'unarchived')
  }

  const product = await prisma.product.update({ where: { id }, data })

  if (changes.length > 0) {
    await logAudit({
      userId: session.userId!,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: id,
      newValue: changes.join(', '),
    })
  }

  return NextResponse.json({ success: true, product })
}