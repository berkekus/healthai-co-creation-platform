import { create } from 'zustand'
import type { User, LoginCredentials, RegisterData } from '../types/auth.types'
import api from '../lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrating: boolean
  error: string | null
  /** Set after registration; UI uses this to redirect to /verify-email */
  pendingVerificationEmail: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'name' | 'institution' | 'city' | 'country' | 'bio' | 'avatarUrl' | 'expertiseTags'>>) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  hydrate: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrating: true,
  error: null,
  pendingVerificationEmail: null,

  hydrate: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isHydrating: false })
      return
    }
    try {
      const { data } = await api.get<{ success: boolean; data: User }>('/auth/me')
      set({ user: data.data, isAuthenticated: true, isHydrating: false })
    } catch {
      localStorage.removeItem('token')
      set({ isHydrating: false })
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post<{ success: boolean; data: { user: User; token: string } }>(
        '/auth/login',
        { email, password }
      )
      localStorage.setItem('token', data.data.token)
      set({ user: data.data.user, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    set({ user: null, isAuthenticated: false })
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null })
    try {
      await api.post<{ success: boolean; data: { user: User; requiresVerification: boolean } }>('/auth/register', data)
      set({ isLoading: false, pendingVerificationEmail: data.email })
      return { requiresVerification: true }
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
      return { requiresVerification: false }
    }
  },

  verifyEmail: async (token: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.post<{ success: boolean; data: { user: User; token: string } }>(
        '/auth/verify-email',
        { token }
      )
      localStorage.setItem('token', res.data.token)
      set({ user: res.data.user, isAuthenticated: true, isLoading: false, pendingVerificationEmail: null })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  resendVerification: async (email: string) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/auth/resend-verification', { email })
      set({ isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  deleteAccount: async (password: string) => {
    set({ isLoading: true, error: null })
    try {
      await api.delete('/auth/me', { data: { password } })
      localStorage.removeItem('token')
      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
      throw err
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.put<{ success: boolean; data: User }>('/auth/me/profile', data)
      set({ user: res.data, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  uploadAvatar: async (file: File) => {
    set({ isLoading: true, error: null })
    try {
      const form = new FormData()
      form.append('avatar', file)
      const { data: res } = await api.post<{ success: boolean; data: User }>('/auth/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set({ user: res.data, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  clearError: () => set({ error: null }),
}))
