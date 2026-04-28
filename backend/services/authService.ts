import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User, { IUser } from '../models/User'

const SALT_ROUNDS = 10

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
  if (existing) {
    const err: Error & { statusCode?: number } = new Error('Email already registered')
    err.statusCode = 409
    throw err
  }

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS)
  const user = await User.create({ ...data, password: hashed, isVerified: true })
  const token = signToken(user)
  return { user: sanitize(user), token }
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('Invalid credentials')
    err.statusCode = 401
    throw err
  }

  if (user.isSuspended) {
    const err: Error & { statusCode?: number } = new Error('Account suspended')
    err.statusCode = 403
    throw err
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    const err: Error & { statusCode?: number } = new Error('Invalid credentials')
    err.statusCode = 401
    throw err
  }

  user.lastActive = new Date()
  await user.save()

  const token = signToken(user)
  return { user: sanitize(user), token }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<IUser, 'name' | 'institution' | 'city' | 'country' | 'bio' | 'expertiseTags'>>
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
