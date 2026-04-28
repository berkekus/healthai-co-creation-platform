import { Router } from 'express'
import { register, login, logout, getMe, updateProfile, changePassword, getUserById, getAllUsers, setSuspended } from '../controllers/authController'
import { protect, adminOnly } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.put('/me/profile', protect, updateProfile)
router.put('/me/password', protect, changePassword)
router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, getUserById)
router.put('/users/:id/suspend', protect, adminOnly, setSuspended)

export default router
