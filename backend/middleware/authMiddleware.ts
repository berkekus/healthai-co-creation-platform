import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
  userEmail?: string
}

interface JwtPayload {
  id: string
  role: string
}

// Throttle lastActive writes: at most once per 5 minutes per user
const lastActiveThrottle = new Map<string, number>()
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    const user = await User.findById(decoded.id).select('isSuspended role email')
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' })
      return
    }
    if (user.isSuspended) {
      res.status(403).json({ success: false, message: 'Account suspended' })
      return
    }

    req.userId = decoded.id
    req.userRole = decoded.role
    req.userEmail = user.email

    const now = Date.now()
    const lastUpdate = lastActiveThrottle.get(decoded.id) ?? 0
    if (now - lastUpdate > LAST_ACTIVE_THROTTLE_MS) {
      lastActiveThrottle.set(decoded.id, now)
      User.findByIdAndUpdate(decoded.id, { $set: { lastActive: new Date() } }).exec().catch(() => {})
    }

    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userRole !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' })
    return
  }
  next()
}
