import { AuthRequest } from '../middleware/authMiddleware'
import * as notificationService from '../services/notificationService'
import { asyncHandler } from '../utils/asyncHandler'

export const createNotification = asyncHandler<AuthRequest>(async (req, res) => {
  const { userId, type, title, body, linkTo } = req.body
  if (!userId || !type || !title || !body) {
    res.status(400).json({ success: false, message: 'userId, type, title and body are required' })
    return
  }
  const notification = await notificationService.pushNotification({ userId, type, title, body, linkTo })
  res.status(201).json({ success: true, data: notification })
})

export const getNotifications = asyncHandler<AuthRequest>(async (req, res) => {
  const notifications = await notificationService.getNotificationsByUser(req.userId as string)
  res.json({ success: true, data: notifications })
})

export const getUnreadCount = asyncHandler<AuthRequest>(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.userId as string)
  res.json({ success: true, data: { count } })
})

export const markRead = asyncHandler<AuthRequest>(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.userId as string)
  res.json({ success: true, data: notification })
})

export const markAllRead = asyncHandler<AuthRequest>(async (req, res) => {
  await notificationService.markAllRead(req.userId as string)
  res.json({ success: true, message: 'All notifications marked as read' })
})

export const deleteNotification = asyncHandler<AuthRequest>(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.userId as string)
  res.json({ success: true, message: 'Notification deleted' })
})

export const deleteAllNotifications = asyncHandler<AuthRequest>(async (req, res) => {
  await notificationService.deleteAllNotifications(req.userId as string)
  res.json({ success: true, message: 'All notifications deleted' })
})
