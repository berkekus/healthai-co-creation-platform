import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as notificationService from '../services/notificationService'

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await notificationService.getNotificationsByUser(req.userId as string)
    res.json({ success: true, data: notifications })
  } catch (err) {
    next(err)
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.userId as string)
    res.json({ success: true, data: { count } })
  } catch (err) {
    next(err)
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationService.markRead(req.params.id, req.userId as string)
    res.json({ success: true, data: notification })
  } catch (err) {
    next(err)
  }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllRead(req.userId as string)
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (err) {
    next(err)
  }
}
