import { Router } from 'express'
import {
  register, login, logout, getMe, updateProfile, updateNotifPrefs, changePassword,
  getUserById, getAllUsers, setSuspended, deleteUser, uploadAvatar,
  verifyEmail, resendVerification, deleteAccount, exportMyData,
  forgotPassword, resetPassword,
} from '../controllers/authController'
import { getPlatformStats } from '../controllers/adminController'
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/authMiddleware'
import { avatarUpload } from '../middleware/uploadMiddleware'
import { authLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../utils/asyncHandler'
import { recalculateBadges, BADGE_META } from '../services/badgeService'
import User from '../models/User'
import passport from 'passport'
import { makeOAuthToken } from '../src/passport'
import type { IUser } from '../models/User'

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
router.put('/me/notif-prefs', protect, updateNotifPrefs)
router.post('/me/avatar', protect, avatarUpload.single('avatar'), uploadAvatar)
router.put('/me/password', protect, changePassword)
router.delete('/me', protect, deleteAccount)
router.get('/me/export', protect, exportMyData)
router.get('/stats', protect, adminOnly, getPlatformStats)
router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, getUserById)
router.patch('/users/:id/suspend', protect, adminOnly, setSuspended)
router.patch('/users/:id/verify', protect, adminOnly, asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const User = (await import('../models/User')).default
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { isVerified: true } }, { new: true })
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  res.json({ success: true, message: 'User verified' })
}))
router.delete('/users/:id', protect, adminOnly, deleteUser)

// OAuth — GitHub
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const oauthRedirect = (token: string) => `${CLIENT_ORIGIN}/oauth-callback?token=${token}`

router.get('/github', passport.authenticate('github', { session: false }))
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${CLIENT_ORIGIN}/login?error=oauth` }),
  (req, res) => {
    const user = req.user as IUser
    const token = makeOAuthToken(user.id as string)
    res.redirect(oauthRedirect(token))
  }
)

// OAuth — LinkedIn
router.get('/linkedin', passport.authenticate('linkedin', { session: false }))
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: `${CLIENT_ORIGIN}/login?error=oauth` }),
  (req, res) => {
    const user = req.user as IUser
    const token = makeOAuthToken(user.id as string)
    res.redirect(oauthRedirect(token))
  }
)

// Badge endpoints
router.get('/users/:id/badges', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('badges collaborationScore').lean()
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  const badgesWithMeta = (user.badges as string[]).map(id => ({
    id,
    ...(BADGE_META[id as keyof typeof BADGE_META] ?? { label: id, icon: 'star', description: '' }),
  }))
  res.json({ success: true, data: { badges: badgesWithMeta, collaborationScore: user.collaborationScore } })
}))

router.post('/users/:id/badges/recalculate', protect, adminOnly, asyncHandler(async (req, res) => {
  await recalculateBadges(req.params.id)
  res.json({ success: true, message: 'Badges recalculated' })
}))

export default router
