import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User, { IUser } from '../models/User'
import Post from '../models/Post'
import Meeting from '../models/Meeting'
import Notification from '../models/Notification'
import { sendVerificationEmail, sendAccountDeletedEmail } from './emailService'
import { pushNotification } from './notificationService'
import { deleteAvatarFile } from '../middleware/uploadMiddleware'

const SALT_ROUNDS = 10
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function signToken(user: IUser): string {
  return jwt.sign(
    { id: user.id as string, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
  )
}

function sanitize(user: IUser) {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    role: user.role,
    institution: user.institution,
    city: user.city,
    country: user.country,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    expertiseTags: user.expertiseTags,
    isVerified: user.isVerified,
    isSuspended: user.isSuspended,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
  }
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
  role: IUser['role']
  institution: string
  city: string
  country: string
}) {
  const existing = await User.findOne({ email: data.email.toLowerCase() })
  if (existing) throw makeError('Email already registered', 409)

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS)
  const verifyToken = generateVerifyToken()
  const user = await User.create({
    ...data,
    password: hashed,
    isVerified: false,
    verifyToken,
    verifyTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  })

  // Send verification email asynchronously — don't block registration response
  sendVerificationEmail(user.email, verifyToken, user.name).catch((err) => {
    console.error('[email] failed to send verification:', err.message)
  })

  return { user: sanitize(user), requiresVerification: true }
}

export async function verifyEmail(token: string) {
  const user = await User.findOne({
    verifyToken: token,
    verifyTokenExpires: { $gt: new Date() },
  })
  if (!user) throw makeError('Invalid or expired verification token', 400)

  user.isVerified = true
  user.verifyToken = undefined
  user.verifyTokenExpires = undefined
  await user.save()

  const jwtToken = signToken(user)
  return { user: sanitize(user), token: jwtToken }
}

export async function resendVerification(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    // Don't reveal whether email is registered — silently succeed
    return
  }
  if (user.isVerified) throw makeError('Account is already verified', 400)

  const verifyToken = generateVerifyToken()
  user.verifyToken = verifyToken
  user.verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)
  await user.save()

  sendVerificationEmail(user.email, verifyToken, user.name).catch((err) => {
    console.error('[email] failed to resend verification:', err.message)
  })
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw makeError('Invalid credentials', 401)

  if (user.isSuspended) throw makeError('Account suspended', 403)

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw makeError('Invalid credentials', 401)

  if (!user.isVerified && process.env.NODE_ENV !== 'development') {
    const err = makeError('Email not verified. Please check your inbox.', 403) as Error & { statusCode: number; code?: string }
    err.code = 'EMAIL_NOT_VERIFIED'
    throw err
  }

  user.lastActive = new Date()
  await user.save()

  const token = signToken(user)
  return { user: sanitize(user), token }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<IUser, 'name' | 'institution' | 'city' | 'country' | 'bio' | 'avatarUrl' | 'expertiseTags'>>
) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('User not found')
    err.statusCode = 404
    throw err
  }
  return sanitize(user)
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId)
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('User not found')
    err.statusCode = 404
    throw err
  }
  return sanitize(user)
}

export async function getAllUsers(opts: {
  role?: string
  search?: string
  page?: number
  limit?: number
}) {
  const { role, search, page = 1, limit = 20 } = opts
  const query: Record<string, unknown> = {}

  if (role) query.role = role
  if (search) {
    query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ])

  return {
    users: users.map(sanitize),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  if (newPassword.length < 8) {
    const err: Error & { statusCode?: number } = new Error('Password must be at least 8 characters')
    err.statusCode = 400
    throw err
  }

  const user = await User.findById(userId)
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  const match = await bcrypt.compare(oldPassword, user.password)
  if (!match) {
    const err: Error & { statusCode?: number } = new Error('Current password is incorrect')
    err.statusCode = 401
    throw err
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await user.save()

  pushNotification({
    userId: user.id as string,
    type: 'account_activity',
    title: 'Şifre değiştirildi',
    body: 'Hesabınızın şifresi başarıyla değiştirildi. Bu işlemi siz yapmadıysanız hemen destek ekibiyle iletişime geçin.',
  }).catch(() => {})
}

export async function exportUserData(userId: string) {
  const [user, posts, meetings, logs] = await Promise.all([
    User.findById(userId).lean(),
    Post.find({ authorId: userId }).lean(),
    Meeting.find({ $or: [{ requesterId: userId }, { ownerId: userId }] }).lean(),
    (await import('./logService')).getLogs({ userId, limit: 200 }),
  ])
  if (!user) throw makeError('User not found', 404)

  const { password: _pw, verifyToken: _vt, verifyTokenExpires: _vte, ...safeUser } = user as Record<string, unknown>
  return {
    exportedAt: new Date().toISOString(),
    gdprNote: 'Exported per GDPR Article 20 — Right to Data Portability.',
    profile: safeUser,
    posts,
    meetings,
    auditLogs: logs.logs,
  }
}

export async function deleteAccount(userId: string, password: string) {
  const user = await User.findById(userId)
  if (!user) throw makeError('User not found', 404)

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw makeError('Incorrect password', 401)

  // Cancel all non-terminal meetings and notify counterparts
  const activeMeetings = await Meeting.find({
    $or: [{ requesterId: userId }, { ownerId: userId }],
    status: { $in: ['pending', 'time_proposed', 'confirmed'] },
  })
  for (const m of activeMeetings) {
    m.status = 'cancelled'
    await m.save()
    const otherUserId =
      m.requesterId.toString() === userId
        ? m.ownerId.toString()
        : m.requesterId.toString()
    pushNotification({
      userId: otherUserId,
      type: 'meeting_cancelled',
      title: 'Toplantı iptal edildi',
      body: `Karşı taraf hesabını sildiği için "${m.postTitle}" görüşmesi iptal edildi.`,
      linkTo: '/meetings',
    }).catch(() => {})
  }

  // Anonymize remaining meeting records (preserve audit trail for the other party)
  await Meeting.updateMany(
    { requesterId: userId },
    { $set: { requesterName: 'Deleted user', requesterEmail: '' } }
  )
  await Meeting.updateMany(
    { ownerId: userId },
    { $set: { ownerName: 'Deleted user', ownerEmail: '' } }
  )

  // Delete the user's posts (Brief: "permanently deleted")
  await Post.deleteMany({ authorId: userId })

  // Delete the user's notifications
  await Notification.deleteMany({ userId })

  // Delete avatar file from disk if it was an uploaded image
  if (user.avatarUrl?.startsWith('/uploads/')) {
    deleteAvatarFile(user.avatarUrl)
  }

  const userEmail = user.email
  const userName = user.name

  await user.deleteOne()

  // Send confirmation email — non-blocking
  sendAccountDeletedEmail(userEmail, userName).catch((err) => {
    console.error('[email] failed to send deletion confirmation:', err.message)
  })

  return { email: userEmail, name: userName }
}

export async function setSuspended(userId: string, isSuspended: boolean) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isSuspended } },
    { new: true }
  )
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('User not found')
    err.statusCode = 404
    throw err
  }
  return sanitize(user)
}
