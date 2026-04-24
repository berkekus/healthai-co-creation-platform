import Notification, { INotification, NotificationType } from '../models/Notification'

export async function pushNotification(data: {
  userId: string
  type: NotificationType
  title: string
  body: string
  linkTo?: string
}) {
  return Notification.create({ ...data, isRead: false })
}

export async function getNotificationsByUser(userId: string): Promise<INotification[]> {
  return Notification.find({ userId }).sort({ createdAt: -1 })
}

export async function markRead(id: string, userId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  )
  if (!notification) {
    const err = new Error('Notification not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }
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
  if (!notification) {
    const err = new Error('Notification not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }
  return notification
}

export async function deleteAllNotifications(userId: string) {
  await Notification.deleteMany({ userId })
}
