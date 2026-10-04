import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import FloatingChat from '../components/layout/FloatingChat'
import { useAuthStore } from '../store/authStore'
import { useConversationStore } from '../store/conversationStore'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const fetchUnreadCount = vi.fn()

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><FloatingChat /></MemoryRouter>)

describe('FloatingChat placement', () => {
  beforeEach(() => {
    fetchUnreadCount.mockClear()
    useAuthStore.setState({
      user: {
        id: 'ana', name: 'Ana Costa', email: 'ana@ulisboa.pt', role: 'healthcare_professional', institution: 'ULisboa',
        city: 'Lisbon', country: 'Portugal', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
      },
      isAuthenticated: true,
    })
    useConversationStore.setState({
      conversations: [], messages: {}, unreadCount: 2, isLoading: false,
      fetchConversations: vi.fn(), fetchMessages: vi.fn(), fetchUnreadCount, markRead: vi.fn(), sendMessage: vi.fn(),
    } as never)
  })

  it('shows the chat bubble on ordinary pages', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('button', { name: 'Open chat' })).toBeInTheDocument()
  })

  it('stays out of the full messaging screen, where it covered the send button on phones', () => {
    renderAt('/messages/c1')
    expect(screen.queryByRole('button', { name: 'Open chat' })).not.toBeInTheDocument()
  })

  it('keeps the unread count fresh there, because the navbar badge depends on it', () => {
    renderAt('/messages')
    expect(fetchUnreadCount).toHaveBeenCalled()
  })
})
