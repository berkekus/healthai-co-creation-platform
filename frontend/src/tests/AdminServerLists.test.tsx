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

  it('does not load the posts list until the Posts tab is opened', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/stats', expect.anything()))
    const postRequests = () => vi.mocked(api.get).mock.calls.filter(c => String(c[0]).startsWith('/posts?'))
    expect(postRequests()).toHaveLength(0)

    fireEvent.click(screen.getAllByRole('button', { name: 'Posts & Listings' })[0])
    await waitFor(() => expect(postRequests()).toHaveLength(1))
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

  it('exports every filtered log, not just the page on screen, with formulas neutralised', async () => {
    const total = 450
    const log = (n: number) => ({
      _id: `l${n}`, timestamp: '2026-10-01T00:00:00.000Z', userId: 'u1', role: 'engineer', action: 'login_failed',
      userEmail: n === 0 ? '=HYPERLINK("http://evil.test")' : `u${n}@example.test`, targetEntityId: '', result: 'failure', ipAddress: '10.0.0.1',
    })
    vi.mocked(api.get).mockImplementation(async (url: string, config?: Config) => {
      if (url !== '/logs') return { data: { success: true, data: null } }
      const page = Number(config?.params?.page ?? 1)
      const limit = Number(config?.params?.limit ?? 50)
      const logs = Array.from({ length: Math.max(0, Math.min(limit, total - (page - 1) * limit)) }, (_, i) => log((page - 1) * limit + i))
      return { data: { success: true, data: { logs, total, page, limit } } }
    })
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:logs' })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Activity Logs' })[0])
    fireEvent.change(await screen.findByDisplayValue('All actions'), { target: { value: 'login_failed' } })
    fireEvent.click(await screen.findByRole('button', { name: /Export CSV/ }))

    await waitFor(() => expect(blobs).toHaveLength(1))
    const csv = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(blobs[0])
    })
    const lines = csv.split('\n')
    expect(lines).toHaveLength(total + 1)
    expect(lines[1]).toContain(`"'=HYPERLINK(""http://evil.test"")"`)
    expect(calls('/logs')).toContainEqual(expect.objectContaining({ page: 3, limit: 200, action: 'login_failed' }))
    click.mockRestore()
  })

  it('keeps a member’s formula-like name as text in the users CSV', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/auth/users') return { data: { success: true, data: { users: [{ _id: 'u1', name: '@SUM(1+1)', email: 'a@example.test', role: 'engineer' }], total: 1 } } }
      return { data: { success: true, data: null } }
    })
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:users' })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/users', expect.anything()))
    fireEvent.click(await screen.findByRole('button', { name: /Export users CSV/ }))

    await waitFor(() => expect(blobs).toHaveLength(1))
    const csv = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(blobs[0])
    })
    expect(csv.split('\n')[1]).toMatch(/^"'@SUM\(1\+1\)"/)
    click.mockRestore()
  })

  it('exports every member, not just the 500 the overview loads', async () => {
    const total = 1200
    vi.mocked(api.get).mockImplementation(async (url: string, config?: Config) => {
      if (url !== '/auth/users') return { data: { success: true, data: null } }
      const page = Number(config?.params?.page ?? 1)
      const limit = Number(config?.params?.limit ?? 20)
      const users = Array.from({ length: Math.max(0, Math.min(limit, total - (page - 1) * limit)) }, (_, i) => {
        const n = (page - 1) * limit + i
        return { _id: `u${n}`, name: `Member ${n}`, email: `m${n}@example.test`, role: 'engineer', createdAt: '2026-09-01T00:00:00.000Z' }
      })
      return { data: { success: true, data: { users, total } } }
    })
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:users' })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /Export users CSV/ }))

    await waitFor(() => expect(blobs).toHaveLength(1))
    const csv = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(blobs[0])
    })
    expect(csv.split('\n')).toHaveLength(total + 1)
    expect(calls('/auth/users')).toContainEqual(expect.objectContaining({ page: 3, limit: 500, excludeAdmins: 'true' }))
    click.mockRestore()
  })

  it('says so when the export stops at the newest 5000 entries', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string, config?: Config) => {
      if (url !== '/logs') return { data: { success: true, data: null } }
      const limit = Number(config?.params?.limit ?? 50)
      const page = Number(config?.params?.page ?? 1)
      const logs = Array.from({ length: limit }, (_, i) => ({ _id: `l${page}-${i}`, action: 'login', result: 'success' }))
      return { data: { success: true, data: { logs, total: 6000, page, limit } } }
    })
    URL.createObjectURL = vi.fn(() => 'blob:logs')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Activity Logs' })[0])
    fireEvent.click(await screen.findByRole('button', { name: /Export CSV/ }))

    expect(await screen.findByText('Only the newest 5000 entries were exported.')).toBeInTheDocument()
    // The Overview's own 200-entry summary carries no page; export requests do.
    expect(calls('/logs').filter(p => p.limit === 200 && p.page !== undefined)).toHaveLength(25)
    click.mockRestore()
  })

  it('filters activity logs on the server and counts all of them', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Activity Logs' })[0])
    expect(await screen.findByText('0 of 4321 entries')).toBeInTheDocument()
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'login_failed' } })
    await waitFor(() => expect(calls('/logs')).toContainEqual(expect.objectContaining({ action: 'login_failed' })))
  })
})
