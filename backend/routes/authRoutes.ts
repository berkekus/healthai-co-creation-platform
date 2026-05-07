import { Router } from 'express'
import {
  register, login, logout, getMe, updateProfile, changePassword,
  getUserById, getAllUsers, setSuspended, deleteUser, uploadAvatar,
  verifyEmail, resendVerification, deleteAccount, exportMyData,
  forgotPassword, resetPassword,
} from '../controllers/authController'
import { protect, adminOnly } from '../middleware/authMiddleware'
import { avatarUpload } from '../middleware/uploadMiddleware'
import { authLimiter } from '../middleware/rateLimiter'

const router = Router()

// Rate-limited only on unauthenticated mutation endpoints
router.post('/register',            authLimiter, register)
router.post('/login',               authLimiter, login)
router.post('/forgot-password',     authLimiter, forgotPassword)
router.post('/resend-verification', authLimiter, resendVerification)
router.post('/reset-password',      authLimiter, resetPassword)
router.post('/verify-email', verifyEmail)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.put('/me/profile', protect, updateProfile)
router.post('/me/avatar', protect, avatarUpload.single('avatar'), uploadAvatar)
router.put('/me/password', protect, changePassword)
router.delete('/me', protect, deleteAccount)
router.get('/me/export', protect, exportMyData)
router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, getUserById)
router.put('/users/:id/suspend', protect, adminOnly, setSuspended)
router.delete('/users/:id', protect, adminOnly, deleteUser)

export default router
