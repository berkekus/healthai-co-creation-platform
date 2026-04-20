import { Router } from 'express'
import {
  requestMeeting, getMeeting, listMeetings,
  acceptMeeting, declineMeeting, cancelMeeting,
} from '../controllers/meetingController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, listMeetings)
router.post('/', protect, requestMeeting)
router.get('/:id', protect, getMeeting)
router.post('/:id/accept', protect, acceptMeeting)
router.post('/:id/decline', protect, declineMeeting)
router.post('/:id/cancel', protect, cancelMeeting)

export default router
