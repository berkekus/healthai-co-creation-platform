import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as authService from '../services/authService'
import { createLog } from '../services/logService'
import { LOG } from '../constants/logActions'
import { asyncHandler } from '../utils/asyncHandler'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = ['engineer', 'healthcare_professional', 'admin'] as const

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
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

    const result = await authService.registerUser({ name: name.trim(), email, password, role, institution, city, country })
    createLog({
      userId: result.user.id,
      userEmail: result.user.email,
      role: result.user.role,
      action: LOG.REGISTER,
      result: 'success',
      ipAddress: req.ip,
    }).catch(() => {})
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    createLog({
      userEmail: (req.body.email as string) ?? 'unknown',
      role: (req.body.role as string) ?? 'unknown',
      action: LOG.REGISTER_FAILED,
      result: 'failure',
      ipAddress: req.ip,
    }).catch(() => {})
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Email and password are required' })
      return
    }
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
    next(err)
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getUserById(req.userId as string)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, institution, city, country, bio, expertiseTags } = req.body
    const user = await authService.updateUserProfile(req.userId as string, {
      name, institution, city, country, bio, expertiseTags,
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
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getUserById(req.params.id)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const role   = typeof req.query.role   === 'string' ? req.query.role   : undefined
    const search = typeof req.query.search === 'string' ? req.query.search : undefined

    const result = await authService.getAllUsers({ role, search, page, limit })
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

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

export async function setSuspended(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
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
  } catch (err) {
    next(err)
  }
}
