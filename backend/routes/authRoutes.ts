import { Router } from 'express'
import {
  register, login, logout, getMe, updateProfile, changePassword,
  getUserById, getAllUsers, setSuspended, uploadAvatar,
  verifyEmail, resendVerification, deleteAccount,
} from '../controllers/authController'
import { protect, adminOnly } from '../middleware/authMiddleware'
import { avatarUpload } from '../middleware/uploadMiddleware'

const router = Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerification)
router.post('/login', login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.put('/me/profile', protect, updateProfile)
router.post('/me/avatar', protect, avatarUpload.single('avatar'), uploadAvatar)
router.put('/me/password', protect, changePassword)
router.delete('/me', protect, deleteAccount)
router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, getUserById)
router.put('/users/:id/suspend', protect, adminOnly, setSuspended)

export default router
