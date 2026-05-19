import { Router } from 'express'
import { rankPostMatches, improvePost, translateText } from '../controllers/aiController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/matches', protect, rankPostMatches)
router.post('/improve-post', protect, improvePost)
router.post('/translate', protect, translateText)

export default router
