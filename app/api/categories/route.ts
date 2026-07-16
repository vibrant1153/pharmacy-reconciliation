import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/auth'

export async function GET() {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Login required.' }, { status: 401 })
  }

  const categories = await prisma.category.findMany({
    include: { subcategories: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, categories })
}

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Owner access required.' }, { status: 403 })
  }

  const { name } = await req.json()

  if (!name || !name.trim()) {
    return NextResponse.json({ success: false, message: 'Category name required.' }, { status: 400 })
  }

  const category = await prisma.category.create({ data: { name: name.trim() } })

  return NextResponse.json({ success: true, category })
}