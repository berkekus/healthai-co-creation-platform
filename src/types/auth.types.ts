export type UserRole = 'engineer' | 'healthcare_professional' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  institution: string
  city: string
  country: string
  bio?: string
  expertiseTags: string[]
  createdAt: string
  isVerified: boolean
  isSuspended: boolean
  lastActive: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: UserRole
  institution: string
  city: string
  country: string
}
