import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

describe('signing out', () => {
  const originalAdapter = api.defaults.adapter
  let sent: InternalAxiosRequestConfig[] = []

  beforeEach(() => {
    sent = []
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      sent.push(config)
      return { status: 200, statusText: 'OK', headers: {}, config, data: { success: true } } as AxiosResponse
    }
    localStorage.setItem('token', 'session-token')
  })

  afterEach(() => {
    api.defaults.adapter = originalAdapter
    localStorage.clear()
    sessionStorage.clear()
  })

  it('still authenticates the logout request, so the server can record it', async () => {
    useAuthStore.getState().logout()

    await vi.waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0].url).toBe('/auth/logout')
    expect(sent[0].headers.Authorization).toBe('Bearer session-token')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
