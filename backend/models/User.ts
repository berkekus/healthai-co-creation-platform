import { Schema, model, Document } from 'mongoose'

export type UserRole = 'engineer' | 'healthcare_professional' | 'admin'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  institution: string
  city: string
  country: string
  bio?: string
  expertiseTags: string[]
  isVerified: boolean
  isSuspended: boolean
  lastActive: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['engineer', 'healthcare_professional', 'admin'],
      required: true,
    },
    institution: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    expertiseTags: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default model<IUser>('User', UserSchema)
