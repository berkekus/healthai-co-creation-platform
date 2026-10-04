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

const users = Array.from({ length: 30 }, (_, i) => ({
  id: `u${i}`, name: `Member ${String(i + 1).padStart(2, '0')}`, email: `member${i}@example.test`, role: 'engineer',
  institution: 'Test University', city: 'Ankara', country: 'Turkey', expertiseTags: [], createdAt: '2026-09-01T10:00:00.000Z',
  isVerified: true, isSuspended: false, lastActive: '2026-09-20T10:00:00.000Z',
}))

async function openUsers() {
  renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
  fireEvent.click(screen.getAllByRole('button', { name: 'Users' })[0])
  await screen.findByText('Member 01')
}

const rows = () => within(screen.getByRole('table')).getAllByText(/^Member \d\d$/)

describe('admin users list', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockImplementation(async (url: string, config?: { params?: { page?: number; limit?: number } }) => {
      // Like the server: one page of members for the requested page and size, plus the full count.
      if (url === '/auth/users') {
        const page = config?.params?.page ?? 1
        const limit = config?.params?.limit ?? 500
        return { data: { success: true, data: { users: users.slice((page - 1) * limit, page * limit), total: users.length } } }
      }
      if (url === '/logs') return { data: { success: true, data: { logs: [], total: 0 } } }
      return { data: { success: true, data: null } }
    })
    useAuthStore.setState({ user: { ...users[0], id: 'admin', role: 'admin' } as never, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  })

  it('lets the admin choose how many users a page shows, and remembers it', async () => {
    await openUsers()
    expect(rows()).toHaveLength(20)

    fireEvent.change(screen.getByLabelText('Per page'), { target: { value: '50' } })

    // The bigger page is a new server request; the previous rows stay until it arrives.
    await waitFor(() => expect(rows()).toHaveLength(30))
    expect(localStorage.getItem('admin_usersPerPage')).toBe('50')
  })

  it('names the page buttons for screen readers', async () => {
    await openUsers()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
  })

  it('focuses the search with "/" unless the admin is typing in a field', async () => {
    await openUsers()
    const search = screen.getByRole('searchbox')

    fireEvent.keyDown(document.body, { key: '/' })
    expect(search).toHaveFocus()

    fireEvent.change(search, { target: { value: 'a' } })
    fireEvent.keyDown(search, { key: '/' })
    expect(search).toHaveValue('a')
  })
})
