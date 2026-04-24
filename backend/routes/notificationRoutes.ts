import { Router } from 'express'
import {
  createNotification, getNotifications, getUnreadCount, markRead, markAllRead,
  deleteNotification, deleteAllNotifications,
} from '../controllers/notificationController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, getNotifications)
router.post('/', protect, createNotification)
router.get('/unread-count', protect, getUnreadCount)
router.post('/mark-all-read', protect, markAllRead)
router.post('/:id/read', protect, markRead)
router.delete('/', protect, deleteAllNotifications)
router.delete('/:id', protect, deleteNotification)

export default router
