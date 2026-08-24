import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import mongoose from 'mongoose'
import User, { IUser } from '../models/User'
import Post from '../models/Post'
import Meeting from '../models/Meeting'
import Notification from '../models/Notification'
import { sendVerificationEmail, sendAccountDeletedEmail, sendPasswordResetEmail } from './emailService'
import { pushNotification } from './notificationService'
import { deleteAvatarFile } from '../middleware/uploadMiddleware'
import { makeError } from '../utils/AppError'
import logger from '../src/logger'

const SALT_ROUNDS = 12
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
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
    notifPrefs: user.notifPrefs,
    isVerified: user.isVerified,
    isSuspended: user.isSuspended,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
  }
}

function publicSanitize(user: IUser) {
  return {
    id: user.id as string,
    name: user.name,
    role: user.role,
    institution: user.institution,
    city: user.city,
    country: user.country,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    expertiseTags: user.expertiseTags,
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
  const rawToken = generateVerifyToken()
  const user = await User.create({
    ...data,
    password: hashed,
    isVerified: false,
    verifyToken: hashToken(rawToken),
    verifyTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  })

  // Send verification email asynchronously — don't block registration response
  sendVerificationEmail(user.email, rawToken, user.name).catch((err) => {
    logger.error({ err }, 'Failed to send verification email')
  })

  return { user: sanitize(user), requiresVerification: true }
}

export async function verifyEmail(token: string) {
  const user = await User.findOne({
    verifyToken: hashToken(token),
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

  const rawToken = generateVerifyToken()
  user.verifyToken = hashToken(rawToken)
  user.verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)
  await user.save()

  sendVerificationEmail(user.email, rawToken, user.name).catch((err) => {
    logger.error({ err }, 'Failed to resend verification email')
  })
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
  if (!user) throw makeError('Invalid credentials', 401)

  if (user.isSuspended) throw makeError('Account suspended', 403)

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw makeError('Invalid credentials', 401)

  if (!user.isVerified) throw makeError('Email not verified. Please check your inbox or request a new verification link.', 403)

  user.lastActive = new Date()
  await user.save()

  const token = signToken(user)
  return { user: sanitize(user), token }
}

export async function updateNotifPrefs(
  userId: string,
  prefs: Partial<IUser['notifPrefs']>
) {
  const update: Record<string, unknown> = {}
  const allowed: (keyof IUser['notifPrefs'])[] = ['meetingRequests', 'meetingUpdates', 'interestReceived', 'adminMessages', 'messages', 'weeklyDigest']
  for (const key of allowed) {
    if (typeof prefs[key] === 'boolean') update[`notifPrefs.${key}`] = prefs[key]
  }
  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
  if (!user) throw makeError('User not found', 404)
  return sanitize(user)
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
  if (!user) throw makeError('User not found', 404)
  return sanitize(user)
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw makeError('User not found', 404)
  return sanitize(user)
}

export async function getPublicUserById(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw makeError('User not found', 404)
  return publicSanitize(user)
}

export async function getAllUsers(opts: {
  role?: string
  search?: string
  isVerified?: string
  page?: number
  limit?: number
}) {
  const { role, search, isVerified, page = 1, limit = 20 } = opts
  const query: Record<string, unknown> = {}

  if (role) query.role = role
  if (isVerified === 'false') query.isVerified = false
  if (isVerified === 'true') query.isVerified = true
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
  if (newPassword.length < 8) throw makeError('Password must be at least 8 characters', 400)

  const user = await User.findById(userId).select('+password')
  if (!user) throw makeError('User not found', 404)

  const match = await bcrypt.compare(oldPassword, user.password)
  if (!match) throw makeError('Current password is incorrect', 400)

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

async function cascadeDeleteUser(
  userId: string,
  notifyBody: string,
  session: mongoose.ClientSession
) {
  const activeMeetings = await Meeting.find(
    { $or: [{ requesterId: userId }, { ownerId: userId }], status: { $in: ['pending', 'time_proposed', 'confirmed'] } },
    null,
    { session }
  )

  const cancellationNotifications: Array<Parameters<typeof pushNotification>[0]> = []

  // MongoDB does not support parallel operations on the same transaction
  // session. Keep these writes sequential so the transaction can be retried
  // safely by withTransaction().
  for (const m of activeMeetings) {
    m.status = 'cancelled'
    await m.save({ session })
    const otherUserId = m.requesterId.toString() === userId ? m.ownerId.toString() : m.requesterId.toString()
    cancellationNotifications.push({
      userId: otherUserId,
      type: 'meeting_cancelled',
      title: 'Toplantı iptal edildi',
      body: notifyBody.replace('{title}', m.postTitle),
      linkTo: '/meetings',
    })
  }

  await Meeting.updateMany(
    { requesterId: userId },
    { $set: { requesterName: 'Deleted user', requesterEmail: '' } },
    { session }
  )
  await Meeting.updateMany(
    { ownerId: userId },
    { $set: { ownerName: 'Deleted user', ownerEmail: '' } },
    { session }
  )
  await Post.deleteMany({ authorId: userId }, { session })
  await Notification.deleteMany({ userId }, { session })

  // Use a fresh model query instead of reusing a document instance across a
  // possible transaction retry. Mongoose document.deleteOne() marks the
  // instance as deleted and may skip a later retry.
  const deletion = await User.deleteOne({ _id: userId }, { session })
  if (deletion.deletedCount !== 1) {
    throw makeError('Account could not be deleted. Please try again.', 409)
  }

  return cancellationNotifications
}

export async function deleteAccount(userId: string, password: string) {
  const user = await User.findById(userId).select('+password')
  if (!user) throw makeError('User not found', 404)

  const match = await bcrypt.compare(password, user.password)
  // This is a failed confirmation inside an authenticated request, not an
  // invalid JWT. Returning 400 prevents the client from ending the session.
  if (!match) throw makeError('Incorrect password', 400)

  const { email: userEmail, name: userName, avatarUrl } = user

  const session = await mongoose.startSession()
  let cancellationNotifications: Array<Parameters<typeof pushNotification>[0]> = []
  try {
    await session.withTransaction(async () => {
      cancellationNotifications = await cascadeDeleteUser(
        userId,
        'Karşı taraf hesabını sildiği için "{title}" görüşmesi iptal edildi.',
        session
      )
    })
  } finally {
    await session.endSession()
  }

  for (const notification of cancellationNotifications) {
    pushNotification(notification).catch(() => {})
  }

  if (avatarUrl?.startsWith('/uploads/')) deleteAvatarFile(avatarUrl)

  sendAccountDeletedEmail(userEmail, userName).catch((err) => {
    logger.error({ err }, 'Failed to send account deletion email')
  })

  return { email: userEmail, name: userName }
}

export async function deleteUserByAdmin(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw makeError('User not found', 404)
  if (user.role === 'admin') throw makeError('Cannot delete another admin account', 403)

  const { email, name, avatarUrl } = user

  const session = await mongoose.startSession()
  let cancellationNotifications: Array<Parameters<typeof pushNotification>[0]> = []
  try {
    await session.withTransaction(async () => {
      cancellationNotifications = await cascadeDeleteUser(
        userId,
        'Karşı taraf hesabı silindiği için "{title}" görüşmesi iptal edildi.',
        session
      )
    })
  } finally {
    await session.endSession()
  }

  for (const notification of cancellationNotifications) {
    pushNotification(notification).catch(() => {})
  }

  if (avatarUrl?.startsWith('/uploads/')) deleteAvatarFile(avatarUrl)

  return { email, name }
}

export async function setSuspended(userId: string, isSuspended: boolean) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isSuspended } },
    { new: true }
  )
  if (!user) throw makeError('User not found', 404)
  return sanitize(user)
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
  // Silently succeed — don't reveal whether email is registered
  if (!user || !user.isVerified) return

  const rawToken = generateVerifyToken()
  user.resetToken = hashToken(rawToken)
  user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  sendPasswordResetEmail(user.email, rawToken, user.name).catch((err) => {
    logger.error({ err }, 'Failed to send password reset email')
  })
}

export async function resetPassword(token: string, newPassword: string) {
  if (newPassword.length < 8) throw makeError('Password must be at least 8 characters', 400)

  const user = await User.findOne({
    resetToken: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select('+password')
  if (!user) throw makeError('Invalid or expired password reset token', 400)

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS)
  user.resetToken = undefined
  user.resetTokenExpires = undefined
  await user.save()

  pushNotification({
    userId: user.id as string,
    type: 'account_activity',
    title: 'Şifre sıfırlandı',
    body: 'Hesabınızın şifresi başarıyla sıfırlandı. Bu işlemi siz yapmadıysanız hemen destek ekibiyle iletişime geçin.',
  }).catch(() => {})

  return sanitize(user)
}
