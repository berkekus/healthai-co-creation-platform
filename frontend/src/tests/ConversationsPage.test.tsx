import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import ConversationsPage from '../pages/messages/ConversationsPage'
import { useConversationStore } from '../store/conversationStore'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

describe('ConversationsPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    useConversationStore.setState({ conversations: [], isLoading: false, fetchConversations: vi.fn().mockResolvedValue(undefined) })
  })

  it('opens the chat of an accepted meeting even when it is not in the loaded list yet', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { id: 'conv-9' } } })

    render(
      <MemoryRouter initialEntries={['/messages?meetingId=meeting-4']}>
        <Routes>
          <Route path="/messages" element={<ConversationsPage />} />
          <Route path="/messages/:id" element={<p>conversation conv-9</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('conversation conv-9')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/conversations/by-meeting/meeting-4')
  })
})
