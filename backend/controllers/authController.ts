import { Request } from 'express'
import { AuthenticatedRequest } from '../middleware/authMiddleware'
import * as authService from '../services/authService'
import { createLog } from '../services/logService'
import { LOG } from '../constants/logActions'
import { asyncHandler } from '../utils/asyncHandler'
import { deleteAvatarFile } from '../middleware/uploadMiddleware'
import { verifyTurnstile } from '../utils/verifyTurnstile'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EDU_EMAIL_RE = /\.edu(\.[a-z]{2,})?$/i
const VALID_ROLES = ['engineer', 'healthcare_professional', 'admin'] as const

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, institution, city, country, captchaToken } = req.body

  const captchaOk = await verifyTurnstile(captchaToken, req.ip)
  if (!captchaOk) {
    res.status(400).json({ success: false, message: 'Human verification failed. Please try again.' })
    return
  }

  if (!name || !email || !password || !role || !institution || !city || !country) {
    res.status(400).json({ success: false, message: 'All fields are required' })
    return
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email format' })
    return
  }
  if (!EDU_EMAIL_RE.test(email)) {
    res.status(400).json({ success: false, message: 'Only institutional .edu email addresses are accepted. Personal email providers are not permitted.' })
    return
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ success: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    return
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Name must be at least 2 characters' })
    return
  }

  try {
    const result = await authService.registerUser({ name: name.trim(), email, password, role, institution, city, country })
    createLog({
      userId: result.user.id,
      userEmail: result.user.email,
      role: result.user.role,
      action: LOG.REGISTER,
      result: 'success',
      ipAddress: req.ip,
    }).catch(() => {})
    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your address.',
      data: result,
    })
  } catch (err) {
    createLog({
      userEmail: (req.body.email as string) ?? 'unknown',
      role: (req.body.role as string) ?? 'unknown',
      action: LOG.REGISTER_FAILED,
      result: 'failure',
      ipAddress: req.ip,
    }).catch(() => {})
    throw err
  }
})

export const login = asyncHandler(async (req, res) => {
  const { email, password, captchaToken } = req.body
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Email and password are required' })
    return
  }

  const captchaOk = await verifyTurnstile(captchaToken, req.ip)
  if (!captchaOk) {
    res.status(400).json({ success: false, message: 'Human verification failed. Please try again.' })
    return
  }

  try {
    const result = await authService.loginUser(email, password)
    createLog({
      userId: result.user.id,
      userEmail: result.user.email,
      role: result.user.role,
      action: LOG.LOGIN,
      result: 'success',
      ipAddress: req.ip,
    }).catch(() => {})
    res.json({ success: true, data: result })
  } catch (err) {
    createLog({
      userEmail: (req.body.email as string) ?? 'unknown',
      role: 'unknown',
      action: LOG.LOGIN_FAILED,
      result: 'failure',
      ipAddress: req.ip,
    }).catch(() => {})
    throw err
  }
})

export const getMe = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const user = await authService.getUserById(req.userId)
  res.json({ success: true, data: user })
})

export const updateNotifPrefs = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { meetingRequests, meetingUpdates, interestReceived, adminMessages, messages, weeklyDigest } = req.body
  const user = await authService.updateNotifPrefs(req.userId, {
    meetingRequests, meetingUpdates, interestReceived, adminMessages, messages, weeklyDigest,
  })
  res.json({ success: true, data: user })
})

export const updateProfile = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { name, institution, city, country, bio, avatarUrl, expertiseTags } = req.body
  const user = await authService.updateUserProfile(req.userId, {
    name, institution, city, country, bio, avatarUrl, expertiseTags,
  })
  createLog({
    userId: user.id,
    userEmail: user.email,
    role: user.role,
    action: LOG.PROFILE_UPDATE,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, data: user })
})

export const getUserById = asyncHandler<Request>(async (req, res) => {
  const user = await authService.getPublicUserById(req.params.id)
  res.json({ success: true, data: user })
})

export const getAllUsers = asyncHandler<Request>(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 20))
  const role       = typeof req.query.role       === 'string' ? req.query.role       : undefined
  const search     = typeof req.query.search     === 'string' ? req.query.search     : undefined
  const isVerified = typeof req.query.isVerified === 'string' ? req.query.isVerified : undefined

  const result = await authService.getAllUsers({ role, search, isVerified, page, limit })
  res.json({ success: true, data: result })
})

export const setSuspended = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { isSuspended } = req.body
  const user = await authService.setSuspended(req.params.id, Boolean(isSuspended))
  createLog({
    userId: req.userId,
    userEmail: req.userEmail,
    role: req.userRole,
    action: isSuspended ? LOG.USER_SUSPEND : LOG.USER_UNSUSPEND,
    targetEntityId: req.params.id,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, data: user })
})

export const changePassword = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'oldPassword and newPassword are required' })
    return
  }
  await authService.changePassword(req.userId, oldPassword, newPassword)
  createLog({
    userId: req.userId,
    userEmail: req.userEmail,
    role: req.userRole,
    action: LOG.PASSWORD_CHANGE,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, message: 'Password updated' })
})

export const logout = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  createLog({
    userId: req.userId,
    userEmail: req.userEmail,
    role: req.userRole,
    action: LOG.LOGOUT,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, message: 'Logged out' })
})

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body
  if (!token || typeof token !== 'string') {
    res.status(400).json({ success: false, message: 'Verification token is required' })
    return
  }
  const result = await authService.verifyEmail(token)
  createLog({
    userId: result.user.id,
    userEmail: result.user.email,
    role: result.user.role,
    action: LOG.EMAIL_VERIFIED,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, data: result })
})

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email || typeof email !== 'string') {
    res.status(400).json({ success: false, message: 'Email is required' })
    return
  }
  await authService.resendVerification(email)
  res.json({ success: true, message: 'If the email is registered and unverified, a new link has been sent.' })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, captchaToken } = req.body
  if (!email || typeof email !== 'string') {
    res.status(400).json({ success: false, message: 'Email is required' })
    return
  }

  const captchaOk = await verifyTurnstile(captchaToken, req.ip)
  if (!captchaOk) {
    res.status(400).json({ success: false, message: 'Human verification failed. Please try again.' })
    return
  }
  await authService.forgotPassword(email)
  createLog({
    userEmail: email,
    role: 'unknown',
    action: LOG.FORGOT_PASSWORD,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, message: 'If the email is registered and verified, a reset link has been sent.' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
    res.status(400).json({ success: false, message: 'token and newPassword are required' })
    return
  }
  const user = await authService.resetPassword(token, newPassword)
  createLog({
    userId: user.id,
    userEmail: user.email,
    role: user.role,
    action: LOG.PASSWORD_RESET,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, message: 'Password has been reset successfully.' })
})

export const deleteAccount = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { password } = req.body
  if (!password || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Password confirmation is required' })
    return
  }

  const result = await authService.deleteAccount(req.userId, password)

  createLog({
    userId: req.userId,
    userEmail: result.email,
    role: req.userRole,
    action: LOG.ACCOUNT_DELETE,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})

  res.json({ success: true, message: 'Account permanently deleted' })
})

export const deleteUser = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const result = await authService.deleteUserByAdmin(req.params.id)
  createLog({
    userId: req.userId,
    userEmail: req.userEmail,
    role: req.userRole,
    action: LOG.USER_DELETE,
    targetEntityId: req.params.id,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, message: `Account ${result.email} permanently deleted` })
})

export const exportMyData = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const data = await authService.exportUserData(req.userId)
  createLog({
    userId: req.userId,
    userEmail: req.userEmail,
    role: req.userRole,
    action: LOG.DATA_EXPORT,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.setHeader('Content-Disposition', `attachment; filename="healthai-export-${req.userId}-${new Date().toISOString().split('T')[0]}.json"`)
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(data, null, 2))
})

export const uploadAvatar = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file provided' })
    return
  }

  const existing = await authService.getUserById(req.userId)
  if (existing.avatarUrl && existing.avatarUrl.startsWith('/uploads/')) {
    deleteAvatarFile(existing.avatarUrl)
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`
  const user = await authService.updateUserProfile(req.userId, { avatarUrl })

  createLog({
    userId: user.id,
    userEmail: user.email,
    role: user.role,
    action: LOG.PROFILE_UPDATE,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})

  res.json({ success: true, data: user })
})
