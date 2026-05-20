import { Schema, model, Document } from 'mongoose'

export type UserRole = 'engineer' | 'healthcare_professional' | 'admin'

export interface INotifPrefs {
  meetingRequests: boolean
  meetingUpdates: boolean
  interestReceived: boolean
  adminMessages: boolean
  messages: boolean
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  institution: string
  city: string
  country: string
  bio?: string
  avatarUrl?: string
  expertiseTags: string[]
  notifPrefs: INotifPrefs
  isVerified: boolean
  verifyToken?: string
  verifyTokenExpires?: Date
  resetToken?: string
  resetTokenExpires?: Date
  isSuspended: boolean
  lastActive: Date
  createdAt: Date
  updatedAt: Date
}

const NotifPrefsSchema = new Schema<INotifPrefs>(
  {
    meetingRequests:  { type: Boolean, default: true },
    meetingUpdates:   { type: Boolean, default: true },
    interestReceived: { type: Boolean, default: true },
    adminMessages:    { type: Boolean, default: true },
    messages:         { type: Boolean, default: true },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['engineer', 'healthcare_professional', 'admin'],
      required: true,
    },
    institution: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    expertiseTags: { type: [String], default: [] },
    notifPrefs: { type: NotifPrefsSchema, default: () => ({}) },
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String, index: true },
    verifyTokenExpires: { type: Date },
    resetToken: { type: String, index: true },
    resetTokenExpires: { type: Date },
    isSuspended: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default model<IUser>('User', UserSchema)
