export type UserRole = 'engineer' | 'healthcare_professional' | 'admin'

export interface NotifPrefs {
  meetingRequests: boolean
  meetingUpdates: boolean
  interestReceived: boolean
  adminMessages: boolean
  messages: boolean
  weeklyDigest: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  institution: string
  city: string
  country: string
  bio?: string
  avatarUrl?: string
  expertiseTags: string[]
  notifPrefs?: NotifPrefs
  createdAt: string
  isVerified: boolean
  isSuspended: boolean
  lastActive: string
  badges?: string[]
  collaborationScore?: number
  githubId?: string
  githubUsername?: string
  linkedinId?: string
  linkedinProfileUrl?: string
}

export interface LoginCredentials {
  email: string
  password: string
  captchaToken?: string
  rememberMe?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: UserRole
  institution: string
  city: string
  country: string
  captchaToken?: string
}
