import { Router } from 'express'
import { protect } from '../middleware/authMiddleware'
import {
  listConversations,
  getConversation,
  getByMeeting,
  listMessages,
  postMessage,
  markRead,
  unreadCount,
  deleteConversation,
} from '../controllers/conversationController'

const router = Router()

router.use(protect)

router.get('/',                          listConversations)
router.get('/unread',                    unreadCount)
router.get('/by-meeting/:meetingId',     getByMeeting)
router.get('/:id',                       getConversation)
router.get('/:id/messages',             listMessages)
router.post('/:id/messages',            postMessage)
router.put('/:id/read',                 markRead)
router.delete('/:id',                   deleteConversation)

export default router
