import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import type { Notification } from '../types/common.types'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))

const ana = {
  id: 'ana', name: 'Ana Costa', email: 'ana.costa@ulisboa.pt', role: 'healthcare_professional' as const,
  institution: 'Universidade de Lisboa', city: 'Lisbon', country: 'Portugal', expertiseTags: [],
  createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

function notice(id: string, type: Notification['type'], title: string): Notification {
  return { id, userId: 'ana', type, title, body: `${title} body`, isRead: false, createdAt: new Date().toISOString() } as Notification
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: ana, isAuthenticated: true })
    const items = [
      notice('n1', 'meeting_request', 'Meeting please'),
      notice('n2', 'new_comment', 'Comment arrived'),
    ]
    useNotificationStore.setState({
      notifications: items,
      fetchByUser: vi.fn(),
      getByUser: () => items,
      markRead: vi.fn(),
      markAllRead: vi.fn(),
    })
  })

  it('filters from the header button, not only from the sidebar', () => {
    render(<MemoryRouter><NotificationsPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Filter notifications' }))
    const menu = screen.getByRole('menu', { name: 'Filter notifications' })
    fireEvent.click(within(menu).getByRole('menuitemradio', { name: /^Meetings/ }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Meetings')
    expect(screen.getByText('Meeting please')).toBeInTheDocument()
    expect(screen.queryByText('Comment arrived')).not.toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
