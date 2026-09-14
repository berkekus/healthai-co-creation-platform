import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import MeetingsPage from '../pages/meetings/MeetingsPage'
import { useAuthStore } from '../store/authStore'
import { useConversationStore } from '../store/conversationStore'
import { useMeetingStore } from '../store/meetingStore'
import { MEETING_STATUS_STYLE } from '../utils/meetingStatus'
import type { Meeting, MeetingStatus } from '../types/meeting.types'
import type { PostStatus } from '../types/post.types'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const me = {
  id: 'me', name: 'Mert Aydın', email: 'mert@metu.edu.tr', role: 'engineer' as const, institution: 'METU',
  city: 'Ankara', country: 'Turkey', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

function meeting(status: MeetingStatus, iAm: 'owner' | 'requester', extra: Partial<Meeting> = {}): Meeting {
  const other = { id: 'ana', name: 'Ana Costa' }
  return {
    id: `m-${status}-${iAm}`,
    postId: 'post-1',
    postTitle: 'Midwife-led postpartum monitoring',
    requesterId: iAm === 'requester' ? me.id : other.id,
    requesterName: iAm === 'requester' ? me.name : other.name,
    ownerId: iAm === 'owner' ? me.id : other.id,
    ownerName: iAm === 'owner' ? me.name : other.name,
    status,
    message: 'I would like to help with the signal processing.',
    ndaAccepted: true,
    proposedSlots: [{ date: '2030-03-14', time: '14:00', timezone: 'America/New_York' }],
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...extra,
  }
}

const actions = {
  accept: vi.fn(), confirm: vi.fn(), decline: vi.fn(), cancel: vi.fn(), complete: vi.fn(), reschedule: vi.fn(),
}

const fetchMeetingsFromServer = useMeetingStore.getState().fetchByUser

function renderPage(meetings: Meeting[], state?: unknown, options: { liveFetch?: boolean } = {}) {
  useMeetingStore.setState({ meetings, fetchByUser: options.liveFetch ? fetchMeetingsFromServer : vi.fn(), ...actions })
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/meetings', state }]}>
      <Routes>
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/messages/:id" element={<p>chat page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MeetingsPage', () => {
  beforeEach(() => {
    Object.values(actions).forEach(action => { action.mockReset().mockResolvedValue(undefined) })
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
    useAuthStore.setState({ user: me, isAuthenticated: true })
    useConversationStore.setState({ fetchConversations: vi.fn() })
  })

  it('names the two directions in plain words and explains them', () => {
    renderPage([])
    expect(screen.getByRole('button', { name: /^received/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sent/i })).toBeInTheDocument()
    expect(screen.getByText(/requests others sent about your posts/i)).toBeInTheDocument()
  })

  it('lets the owner decline a request without accepting it first', async () => {
    renderPage([meeting('pending', 'owner')])

    fireEvent.click(screen.getByRole('button', { name: 'Decline' }))
    fireEvent.click(screen.getByRole('button', { name: /confirm decline/i }))

    await waitFor(() => expect(actions.decline).toHaveBeenCalledWith('m-pending-owner', undefined))
  })

  it('tells the requester who they are waiting for', () => {
    renderPage([meeting('pending', 'requester')])
    expect(screen.getByText('Waiting for Ana Costa to respond to your request.')).toBeInTheDocument()
  })

  it('opens the chat as soon as the request has been accepted', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { id: 'conv-7' } } })
    renderPage([meeting('time_proposed', 'requester')])

    fireEvent.click(screen.getByRole('button', { name: /open chat/i }))

    expect(await screen.findByText('chat page')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/conversations/by-meeting/m-time_proposed-requester')
  })

  it('calls a finished meeting "held" instead of offering to "complete" it', () => {
    renderPage([meeting('confirmed', 'requester', { confirmedSlot: { date: '2030-03-14', time: '14:00' } })])
    expect(screen.getByRole('button', { name: /mark as held/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^complete$/i })).not.toBeInTheDocument()
  })

  it('shows which time zone a proposed time belongs to', () => {
    renderPage([meeting('time_proposed', 'owner')])
    expect(screen.getAllByText(/New York/).length).toBeGreaterThan(0)
  })

  it('lets the requester offer new times while the owner is still choosing', async () => {
    renderPage([meeting('time_proposed', 'requester')])

    fireEvent.click(screen.getByRole('button', { name: /propose new times/i }))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2030-04-02' } })
    fireEvent.change(screen.getByLabelText('Hour'), { target: { value: '09' } })
    fireEvent.change(screen.getByLabelText('Minute'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: /send new times/i }))

    await waitFor(() => expect(actions.reschedule).toHaveBeenCalledOnce())
    const [id, slots] = actions.reschedule.mock.calls[0]
    expect(id).toBe('m-time_proposed-requester')
    expect(slots[0]).toMatchObject({ date: '2030-04-02', time: '09:30' })
  })

  it('confirms that a request was just sent', () => {
    renderPage([], { requestSentTo: 'Ana Costa' })
    expect(screen.getByRole('status')).toHaveTextContent('Request sent to Ana Costa')
  })

  it('names the status tabs after the statuses and gives held meetings a tab of their own', () => {
    const slot = { date: '2030-03-14', time: '14:00' }
    renderPage([
      meeting('confirmed', 'requester', { id: 'm-1', postTitle: 'Scheduled project', confirmedSlot: slot }),
      meeting('completed', 'requester', { id: 'm-2', postTitle: 'Held project', confirmedSlot: slot }),
    ])

    fireEvent.click(screen.getByRole('button', { name: /^held/i }))
    expect(screen.getByText('Held project')).toBeInTheDocument()
    expect(screen.queryByText('Scheduled project')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^scheduled/i }))
    expect(screen.getByText('Scheduled project')).toBeInTheDocument()
    expect(screen.queryByText('Held project')).not.toBeInTheDocument()
  })

  it('asks before closing the post with Partner Found and then shows it as closed', async () => {
    let serverPostStatus: PostStatus = 'active'
    const slot = { date: '2030-03-14', time: '14:00' }
    vi.mocked(api.get).mockImplementation(async () => ({
      data: { success: true, data: [meeting('completed', 'owner', { confirmedSlot: slot, postStatus: serverPostStatus })] },
    }))
    vi.mocked(api.post).mockImplementation(async () => {
      serverPostStatus = 'partner_found'
      return { data: { success: true, data: { id: 'post-1', status: 'partner_found' } } }
    })
    renderPage([], undefined, { liveFetch: true })

    fireEvent.click(await screen.findByRole('button', { name: /mark partner found/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/requests still waiting for an answer will be closed/i)
    fireEvent.click(within(dialog).getByRole('button', { name: /yes, mark partner found/i }))

    expect(await screen.findByText(/your post is marked as partner found/i)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/posts/post-1/partner-found')
    expect(screen.queryByRole('button', { name: /mark partner found/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to post/i })).toHaveAttribute('href', '/posts/post-1')
  })
})

describe('meeting status styles', () => {
  it('gives every status a colour of its own', () => {
    const classNames = Object.values(MEETING_STATUS_STYLE).map(style => style.className)
    expect(new Set(classNames).size).toBe(classNames.length)
  })
})
