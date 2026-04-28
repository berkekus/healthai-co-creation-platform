import { create } from 'zustand'
import type { User, LoginCredentials, RegisterData } from '../types/auth.types'
import api from '../lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrating: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'name' | 'institution' | 'city' | 'country' | 'bio' | 'expertiseTags'>>) => Promise<void>
  hydrate: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrating: true,
  error: null,

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
      const { data: res } = await api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/register', data)
      localStorage.setItem('token', res.data.token)
      set({ user: res.data.user, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
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

  clearError: () => set({ error: null }),
}))
