import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../lib/api'
import { disconnectSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth.types'

vi.mock('../lib/api', () => ({
  default: {
    delete: vi.fn(),
  },
}))

vi.mock('../lib/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}))

const user = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@university.edu',
  role: 'engineer',
  institution: 'Test University',
  city: 'Istanbul',
  country: 'Turkey',
  expertiseTags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  isVerified: true,
  isSuspended: false,
  lastActive: '2026-01-01T00:00:00.000Z',
} satisfies User

describe('authStore.deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      isLoading: false,
      isHydrating: false,
      error: null,
    })
  })

  it('clears both token stores and disconnects the socket after deletion', async () => {
    vi.mocked(api.delete).mockResolvedValue({} as Awaited<ReturnType<typeof api.delete>>)
    localStorage.setItem('token', 'remembered-token')
    sessionStorage.setItem('token', 'session-token')

    await useAuthStore.getState().deleteAccount('correct-password')

    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(disconnectSocket).toHaveBeenCalledOnce()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('keeps the session and user when password confirmation fails', async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error('Incorrect password'))
    localStorage.setItem('token', 'valid-token')

    await expect(useAuthStore.getState().deleteAccount('wrong-password')).rejects.toThrow('Incorrect password')

    expect(localStorage.getItem('token')).toBe('valid-token')
    expect(disconnectSocket).not.toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().error).toBe('Incorrect password')
  })
})
