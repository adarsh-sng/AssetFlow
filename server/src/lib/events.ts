import type { ActivityEntityType, NotificationType } from '@prisma/client'
import { prisma } from './prisma.ts'

type EventInput = {
  actorId?: string | null
  action: string
  entityType: ActivityEntityType
  entityId: string
  description: string
  metadata?: Record<string, unknown>
}

type NotificationInput = {
  recipientId?: string | null
  type: NotificationType
  title: string
  message: string
  entityType?: ActivityEntityType
  entityId?: string
}

export async function logActivity(input: EventInput) {
  return prisma.activityLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata as never,
    },
  })
}

export async function notify(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  })
}
