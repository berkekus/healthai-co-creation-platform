import { Router } from 'express'
import { rankPostMatches, improvePost, translateText, getProfileScore, getMeetingSummary } from '../controllers/aiController'
import { protect } from '../middleware/authMiddleware'
import { aiLimiter } from '../middleware/rateLimiter'

const router = Router()

// After `protect`, so the allowance is counted per member, not per network.
router.use(protect, aiLimiter)

router.post('/matches', rankPostMatches)
router.post('/improve-post', improvePost)
router.post('/translate', translateText)
router.get('/profile-score', getProfileScore)
router.post('/meeting-summary/:meetingId', getMeetingSummary)

export default router
