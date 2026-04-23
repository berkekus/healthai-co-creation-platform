import { Router } from 'express'
import { register, login, getMe, updateProfile, getUserById, getAllUsers, setSuspended } from '../controllers/authController'
import { protect, adminOnly } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/me/profile', protect, updateProfile)
router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, getUserById)
router.put('/users/:id/suspend', protect, adminOnly, setSuspended)

export default router
