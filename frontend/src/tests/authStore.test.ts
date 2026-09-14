import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../lib/api'
import { disconnectSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth.types'

vi.mock('../lib/api', () => ({
  default: {
    delete: vi.fn(),
    post: vi.fn(),
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

describe('authStore.register', () => {
  const registration = {
    name: 'Alice Smith',
    email: 'alice@university.edu',
    password: 'password123',
    role: 'engineer' as const,
    institution: 'Test University',
    city: 'Lisbon',
    country: 'Portugal',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ error: null, errorStatus: null, pendingVerificationEmail: null, verificationResent: false })
  })

  it('remembers that a pending registration was sent a fresh verification link', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, data: { email: registration.email, requiresVerification: true, pendingVerification: true } },
    } as Awaited<ReturnType<typeof api.post>>)

    await useAuthStore.getState().register(registration)

    expect(useAuthStore.getState().pendingVerificationEmail).toBe('alice@university.edu')
    expect(useAuthStore.getState().verificationResent).toBe(true)
  })

  it('keeps the HTTP status of a refused registration so the page can explain it', async () => {
    vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Email already registered'), { status: 409 }))

    await useAuthStore.getState().register(registration)

    expect(useAuthStore.getState().error).toBe('Email already registered')
    expect(useAuthStore.getState().errorStatus).toBe(409)
  })
})
