import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const { name } = await req.json()

  if (!name || !name.trim()) {
    return NextResponse.json({ success: false, message: 'Subcategory name required.' }, { status: 400 })
  }

  const subcategory = await prisma.subcategory.create({
    data: { name: name.trim(), categoryId: id },
  })

  return NextResponse.json({ success: true, subcategory })
}