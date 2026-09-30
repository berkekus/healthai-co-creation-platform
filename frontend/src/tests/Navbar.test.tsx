import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import Navbar from '../components/layout/Navbar'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { useConversationStore } from '../store/conversationStore'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const ana = {
  id: 'ana', name: 'Ana Costa', email: 'ana.costa@ulisboa.pt', role: 'healthcare_professional' as const,
  institution: 'Universidade de Lisboa', city: 'Lisbon', country: 'Portugal', expertiseTags: [],
  createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr')
    useAuthStore.setState({ user: ana, isAuthenticated: true })
    useNotificationStore.setState({ notifications: [], unreadTotal: 2, unreadCount: () => 2, fetchByUser: vi.fn() })
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('names the role in words in the account menu', () => {
    renderNavbar()
    fireEvent.click(screen.getByRole('button', { name: 'Hesap menüsü' }))

    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Sağlık Profesyoneli')
    expect(menu).not.toHaveTextContent('healthcare_professional')
  })

  it('announces unread notifications in the interface language', () => {
    renderNavbar()
    expect(screen.getByRole('button', { name: 'Bildirimler (2 okunmamış)' })).toBeInTheDocument()
  })

  it('links to messages from the header with the unread count', () => {
    useConversationStore.setState({ unreadCount: 3 })
    renderNavbar()
    const link = screen.getByRole('link', { name: 'Mesajlar (3 okunmamış)' })
    expect(link).toHaveAttribute('href', '/messages')
    expect(link).toHaveTextContent('3')
  })
})
