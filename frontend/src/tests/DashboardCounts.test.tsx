import { beforeEach, describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import DashboardPage from '../pages/dashboard/DashboardPage'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const page = (total: number) => ({ data: { success: true, data: { posts: [], total, page: 1, limit: 5, pages: Math.ceil(total / 5) } } })

describe('Dashboard counts', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('status=active')) return page(40)
      if (url.includes('status=meeting_scheduled')) return page(2)
      if (url.startsWith('/posts?')) return page(142)
      return { data: { success: true, data: null } }
    })
    useAuthStore.setState({ user: { id: 'me', name: 'Me', role: 'engineer', expertiseTags: [] } as never, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  })

  it('shows the real number of my posts from the server total, not the length of a capped list', async () => {
    renderWithQuery(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(await screen.findByText('142')).toBeInTheDocument()
  })

  it('counts open listings as active plus meeting-scheduled, from the server', async () => {
    renderWithQuery(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(await screen.findByText('42')).toBeInTheDocument()
  })
})
