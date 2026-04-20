import { Router } from 'express'
import { getLogs } from '../controllers/logController'
import { protect, adminOnly } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, adminOnly, getLogs)

export default router
