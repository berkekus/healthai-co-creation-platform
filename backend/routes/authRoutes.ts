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
import {
  makeLinkToken, isProviderConfigured, providerStartUrl, type OAuthProvider,
} from '../src/passport'
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

// ─── OAuth account linking ──────────────────────────────────────────────────
// Linking only: these routes attach a provider identity to the signed-in
// account. They never create or sign in a user — see src/passport.ts for why.

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').replace(/\/+$/, '')
const linkResult = (params: string) => `${CLIENT_ORIGIN}/profile?${params}`

const PROVIDERS: OAuthProvider[] = ['github', 'linkedin']

for (const provider of PROVIDERS) {
  /**
   * Step 1 — the profile page asks (with its bearer token) where to send the
   * browser. The reply carries a short-lived token naming the caller, which the
   * provider echoes back to us as `state`; that is how the callback, which has
   * no session of its own, learns whose account to link.
   */
  router.get(`/${provider}/link-url`, protect, asyncHandler(async (req, res) => {
    if (!isProviderConfigured(provider)) {
      res.status(503).json({
        success: false,
        message: `${provider} sign-in is not configured on this server.`,
      })
      return
    }
    const userId = (req as AuthenticatedRequest).userId
    res.json({ success: true, data: { url: providerStartUrl(provider, makeLinkToken(userId, provider)) } })
  }))

  // Step 2 — hand off to the provider, forwarding the state token untouched.
  router.get(`/${provider}`, (req, res, next) => {
    if (!isProviderConfigured(provider)) {
      res.redirect(linkResult(`oauth_error=not_configured&provider=${provider}`))
      return
    }
    passport.authenticate(provider, {
      session: false,
      state: String(req.query.state ?? ''),
    } as passport.AuthenticateOptions)(req, res, next)
  })

  /**
   * Step 3 — the provider comes back. A custom callback (rather than
   * `failureRedirect`) so the reason for a refusal survives into the redirect
   * and the profile page can say something specific.
   */
  router.get(`/${provider}/callback`, (req, res, next) => {
    passport.authenticate(
      provider,
      { session: false },
      (err: Error | null, user: IUser | false, info?: { code?: string }) => {
        if (err) {
          res.redirect(linkResult(`oauth_error=server_error&provider=${provider}`))
          return
        }
        if (!user) {
          res.redirect(linkResult(`oauth_error=${info?.code ?? 'failed'}&provider=${provider}`))
          return
        }
        res.redirect(linkResult(`linked=${provider}`))
      },
    )(req, res, next)
  })

  /** Detach a linked provider. */
  router.delete(`/${provider}/link`, protect, asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).userId
    const unset = provider === 'github'
      ? { githubId: '', githubUsername: '' }
      : { linkedinId: '', linkedinProfileUrl: '' }
    await User.findByIdAndUpdate(userId, { $unset: unset })
    res.json({ success: true, message: `${provider} disconnected` })
  }))
}

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
