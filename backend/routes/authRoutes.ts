import { Router } from 'express'
import { register, login, getMe, updateProfile, getUserById } from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/me/profile', protect, updateProfile)
router.get('/users/:id', protect, getUserById)

export default router
