import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import AdminPage from '../pages/admin/AdminPage'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

type Config = { params?: Record<string, unknown> }
const calls = (url: string) => vi.mocked(api.get).mock.calls.filter(c => c[0] === url).map(c => (c[1] as Config | undefined)?.params ?? {})

describe('admin lists use the server', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockImplementation(async (url: string, config?: Config) => {
      if (url.startsWith('/posts?')) return { data: { success: true, data: { posts: [], total: 1234, page: 1, limit: 20, pages: 62 } } }
      if (url === '/auth/users') return { data: { success: true, data: { users: [], total: config?.params?.search ? 3 : 900 } } }
      if (url === '/logs') return { data: { success: true, data: { logs: [], total: 4321, page: 1, limit: 50 } } }
      return { data: { success: true, data: null } }
    })
    useAuthStore.setState({ user: { id: 'admin', role: 'admin', name: 'A' } as never, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  })

  it('shows the real number of posts, not the 100 the list used to stop at', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Posts & Listings' })[0])
    expect(await screen.findByText('1234 total listings')).toBeInTheDocument()
  })

  it('searches members on the server, without admins', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Users' })[0])
    fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'ayse' } })
    await waitFor(() => expect(calls('/auth/users')).toContainEqual(expect.objectContaining({ search: 'ayse', excludeAdmins: 'true' })))
  })

  it('steps back to the last real page when removing the only post on the last page empties it', async () => {
    const post = { _id: 'p41', title: 'Last post on page 3', authorId: 'u1', authorName: 'X', domain: 'Cardiology', status: 'active', createdAt: '2026-09-01T00:00:00.000Z' }
    let total = 41
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.startsWith('/posts?')) {
        const page = Number(new URLSearchParams(url.split('?')[1]).get('page'))
        const pages = Math.ceil(total / 20)
        return { data: { success: true, data: { posts: page === 3 && total === 41 ? [post] : [], total, page, limit: 20, pages } } }
      }
      return { data: { success: true, data: null } }
    })
    vi.mocked(api.delete).mockImplementation(async () => { total = 40; return { data: { success: true } } })

    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Posts & Listings' })[0])
    fireEvent.click(await screen.findByRole('button', { name: '3' }))
    fireEvent.click(await screen.findByRole('button', { name: /Remove/ }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page'))
    expect(vi.mocked(api.get).mock.calls.map(c => c[0] as string)).toContainEqual(expect.stringContaining('page=2&'))
  })

  it('filters activity logs on the server and counts all of them', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Activity Logs' })[0])
    expect(await screen.findByText('0 of 4321 entries')).toBeInTheDocument()
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'login_failed' } })
    await waitFor(() => expect(calls('/logs')).toContainEqual(expect.objectContaining({ action: 'login_failed' })))
  })
})
