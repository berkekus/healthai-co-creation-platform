import { beforeEach, describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import AdminPage from '../pages/admin/AdminPage'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const today = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

// Only three users come back from the list endpoint; the platform really has 1,205.
const listedUsers = Array.from({ length: 3 }, (_, i) => ({
  id: `u${i}`, name: `Member ${i}`, email: `m${i}@example.test`, role: 'engineer', institution: 'T', city: 'Ankara',
  country: 'Turkey', expertiseTags: [], createdAt: new Date().toISOString(), isVerified: true, isSuspended: false, lastActive: '',
}))

describe('admin user growth chart', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/auth/users') return { data: { success: true, data: { users: listedUsers, total: 1205 } } }
      if (url === '/auth/stats') {
        return { data: { success: true, data: {
          usersByRole: {}, postsByStatus: {}, postsByDomain: [], meetingsByStatus: {}, meetingCompletionRate: 0,
          newUsersLast30: 5, newPostsLast30: 0,
          userGrowth: { timezone: timeZone, totalBefore: 1200, daily: [{ date: today, count: 5 }] },
        } } }
      }
      if (url === '/logs') return { data: { success: true, data: { logs: [], total: 0 } } }
      return { data: { success: true, data: null } }
    })
    useAuthStore.setState({ user: { ...listedUsers[0], id: 'admin', role: 'admin' } as never, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  })

  it('asks the server for growth in the viewer’s time zone', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/stats', { params: { tz: timeZone } }))
  })

  it('draws the running total from the server, not from the users the list happened to return', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    // The chart's top axis label is today's total: 1,200 earlier sign-ups + 5 today.
    expect(await screen.findByText('1205')).toBeInTheDocument()
  })
})
