import Notification, { NotificationType } from '../models/Notification'
import { makeError } from '../utils/AppError'

export async function pushNotification(data: {
  userId: string
  type: NotificationType
  title: string
  body: string
  linkTo?: string
}) {
  return Notification.create({ ...data, isRead: false })
}

export async function getNotificationsByUser(
  userId: string,
  opts: { page?: number; limit?: number; isRead?: boolean } = {}
) {
  const { page = 1, limit = 20, isRead } = opts
  const query: Record<string, unknown> = { userId }
  if (isRead !== undefined) query.isRead = isRead

  const skip = (page - 1) * limit
  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
  ])
  return { notifications, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function markRead(id: string, userId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  )
  if (!notification) throw makeError('Notification not found', 404)
  return notification
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false })
}

export async function deleteNotification(id: string, userId: string) {
  const notification = await Notification.findOneAndDelete({ _id: id, userId })
  if (!notification) throw makeError('Notification not found', 404)
  return notification
}

export async function deleteAllNotifications(userId: string) {
  await Notification.deleteMany({ userId })
}
