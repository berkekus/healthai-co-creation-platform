import { Router } from 'express'
import { rankPostMatches, improvePost, translateText, getProfileScore, getMeetingSummary } from '../controllers/aiController'
import { protect } from '../middleware/authMiddleware'
import { aiLimiter } from '../middleware/rateLimiter'

const router = Router()

router.use(aiLimiter)

router.post('/matches', protect, rankPostMatches)
router.post('/improve-post', protect, improvePost)
router.post('/translate', protect, translateText)
router.get('/profile-score', protect, getProfileScore)
router.post('/meeting-summary/:meetingId', protect, getMeetingSummary)

export default router
