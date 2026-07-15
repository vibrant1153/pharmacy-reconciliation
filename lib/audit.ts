import { prisma } from '@/lib/prisma'

export async function logAudit(params: {
  userId: string
  action: string
  entity: string
  entityId: string
  oldValue?: string
  newValue?: string
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValue: params.oldValue,
      newValue: params.newValue,
    },
  })
}