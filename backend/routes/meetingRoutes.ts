import { Router } from 'express'
import {
  requestMeeting, getMeeting, listMeetings,
  acceptMeeting, declineMeeting, cancelMeeting, completeMeeting,
} from '../controllers/meetingController'
import { protect } from '../middleware/authMiddleware'
import { meetingRequestLimiter } from '../middleware/rateLimiter'

const router = Router()

router.get('/', protect, listMeetings)
router.post('/', protect, meetingRequestLimiter, requestMeeting)
router.get('/:id', protect, getMeeting)
router.post('/:id/accept', protect, acceptMeeting)
router.post('/:id/decline', protect, declineMeeting)
router.post('/:id/cancel', protect, cancelMeeting)
router.post('/:id/complete', protect, completeMeeting)

export default router
