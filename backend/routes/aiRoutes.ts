import { Router } from 'express'
import { rankPostMatches } from '../controllers/aiController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/matches', protect, rankPostMatches)

export default router
