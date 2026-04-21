import { create } from 'zustand'
import type { User, LoginCredentials, RegisterData } from '../types/auth.types'
import { mockUsers, MOCK_CREDENTIALS } from '../data/mockUsers'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'name' | 'institution' | 'city' | 'country' | 'bio' | 'expertiseTags'>>) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null })
    await new Promise(r => setTimeout(r, 600))
    const expected = MOCK_CREDENTIALS[email]
    if (!expected || expected !== password) {
      set({ isLoading: false, error: 'Invalid email or password.' })
      return
    }
    const user = mockUsers.find(u => u.email === email) ?? null
    if (user?.isSuspended) {
      set({ isLoading: false, error: 'This account has been suspended.' })
      return
    }
    set({ user, isAuthenticated: true, isLoading: false })
  },

  logout: () => set({ user: null, isAuthenticated: false }),

  register: async (data) => {
    set({ isLoading: true, error: null })
    await new Promise(r => setTimeout(r, 800))
    if (!data.email.endsWith('.edu')) {
      set({ isLoading: false, error: 'Only institutional .edu email addresses are accepted.' })
      return
    }
    const exists = mockUsers.find(u => u.email === data.email)
    if (exists) {
      set({ isLoading: false, error: 'An account with this email already exists.' })
      return
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      institution: data.institution,
      city: data.city,
      country: data.country,
      expertiseTags: [],
      createdAt: new Date().toISOString(),
      isVerified: false,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    MOCK_CREDENTIALS[data.email] = data.password
    set({ isLoading: false })
  },

  updateProfile: (data) => set(s => {
    if (!s.user) return s
    const updated = { ...s.user, ...data }
    const idx = mockUsers.findIndex(u => u.id === s.user!.id)
    if (idx !== -1) Object.assign(mockUsers[idx], data)
    return { user: updated }
  }),

  clearError: () => set({ error: null }),
}))
