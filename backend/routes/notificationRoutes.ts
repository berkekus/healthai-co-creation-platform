import { Router } from 'express'
import {
  createNotification, getNotifications, getUnreadCount, markRead, markAllRead,
} from '../controllers/notificationController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, getNotifications)
router.post('/', protect, createNotification)
router.get('/unread-count', protect, getUnreadCount)
router.post('/mark-all-read', protect, markAllRead)
router.post('/:id/read', protect, markRead)

export default router
