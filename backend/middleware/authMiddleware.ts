import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

interface JwtPayload {
  id: string
  role: string
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    const user = await User.findById(decoded.id).select('isSuspended role')
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
