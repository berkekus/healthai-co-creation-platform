import { AuthenticatedRequest } from '../middleware/authMiddleware'
import * as notificationService from '../services/notificationService'
import { asyncHandler } from '../utils/asyncHandler'

export const createNotification = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { userId, type, title, body, linkTo } = req.body
  if (!userId || !type || !title || !body) {
    res.status(400).json({ success: false, message: 'userId, type, title and body are required' })
    return
  }
  const notification = await notificationService.pushNotification({ userId, type, title, body, linkTo })
  res.status(201).json({ success: true, data: notification })
})

export const getNotifications = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined

  const result = await notificationService.getNotificationsByUser(req.userId, { page, limit, isRead })
  res.json({ success: true, data: result })
})

export const getUnreadCount = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.userId)
  res.json({ success: true, data: { count } })
})

export const markRead = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.userId)
  res.json({ success: true, data: notification })
})

export const markAllRead = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  await notificationService.markAllRead(req.userId)
  res.json({ success: true, message: 'All notifications marked as read' })
})

export const deleteNotification = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.userId)
  res.json({ success: true, message: 'Notification deleted' })
})

export const deleteAllNotifications = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  await notificationService.deleteAllNotifications(req.userId)
  res.json({ success: true, message: 'All notifications deleted' })
})
