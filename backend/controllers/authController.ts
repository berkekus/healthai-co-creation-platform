import { Request } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as authService from '../services/authService'
import { createLog } from '../services/logService'
import { LOG } from '../constants/logActions'
import { asyncHandler } from '../utils/asyncHandler'
import { deleteAvatarFile } from '../middleware/uploadMiddleware'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = ['engineer', 'healthcare_professional', 'admin'] as const

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, institution, city, country } = req.body

  if (!name || !email || !password || !role || !institution || !city || !country) {
    res.status(400).json({ success: false, message: 'All fields are required' })
    return
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email format' })
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
  const { email, password } = req.body
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Email and password are required' })
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

export const getMe = asyncHandler<AuthRequest>(async (req, res) => {
  const user = await authService.getUserById(req.userId as string)
  res.json({ success: true, data: user })
})

export const updateProfile = asyncHandler<AuthRequest>(async (req, res) => {
  const { name, institution, city, country, bio, avatarUrl, expertiseTags } = req.body
  const user = await authService.updateUserProfile(req.userId as string, {
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
  const user = await authService.getUserById(req.params.id)
  res.json({ success: true, data: user })
})

export const getAllUsers = asyncHandler<Request>(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const role   = typeof req.query.role   === 'string' ? req.query.role   : undefined
  const search = typeof req.query.search === 'string' ? req.query.search : undefined

  const result = await authService.getAllUsers({ role, search, page, limit })
  res.json({ success: true, data: result })
})

export const setSuspended = asyncHandler<AuthRequest>(async (req, res) => {
  const { isSuspended } = req.body
  const user = await authService.setSuspended(req.params.id, Boolean(isSuspended))
  createLog({
    userId: req.userId as string,
    userEmail: req.userEmail as string,
    role: req.userRole as string,
    action: isSuspended ? LOG.USER_SUSPEND : LOG.USER_UNSUSPEND,
    targetEntityId: req.params.id,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, data: user })
})

export const changePassword = asyncHandler<AuthRequest>(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'oldPassword and newPassword are required' })
    return
  }
  await authService.changePassword(req.userId as string, oldPassword, newPassword)
  createLog({
    userId: req.userId as string,
    userEmail: req.userEmail as string,
    role: req.userRole as string,
    action: LOG.PASSWORD_CHANGE,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
  res.json({ success: true, message: 'Password updated' })
})

export const logout = asyncHandler<AuthRequest>(async (req, res) => {
  createLog({
    userId: req.userId as string,
    userEmail: req.userEmail as string,
    role: req.userRole as string,
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

export const deleteAccount = asyncHandler<AuthRequest>(async (req, res) => {
  const { password } = req.body
  if (!password || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Password confirmation is required' })
    return
  }

  const result = await authService.deleteAccount(req.userId as string, password)

  createLog({
    userId: req.userId as string,
    userEmail: result.email,
    role: req.userRole as string,
    action: LOG.ACCOUNT_DELETE,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})

  res.json({ success: true, message: 'Account permanently deleted' })
})

export const uploadAvatar = asyncHandler<AuthRequest>(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file provided' })
    return
  }

  const existing = await authService.getUserById(req.userId as string)
  // delete old uploaded avatar (skip if it's an external URL)
  if (existing.avatarUrl && existing.avatarUrl.startsWith('/uploads/')) {
    deleteAvatarFile(existing.avatarUrl)
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`
  const user = await authService.updateUserProfile(req.userId as string, { avatarUrl })

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
