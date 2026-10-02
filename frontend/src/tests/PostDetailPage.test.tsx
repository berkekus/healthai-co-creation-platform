import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import i18n from '../i18n'
import api from '../lib/api'
import PostDetailPage from '../pages/posts/PostDetailPage'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import { usePostStore } from '../store/postStore'
import type { Post } from '../types/post.types'
import type { User } from '../types/auth.types'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const owner: User = {
  id: 'owner-1', name: 'Ana Costa', email: 'ana@ul.pt', role: 'healthcare_professional', institution: 'ULisboa',
  city: 'Lisbon', country: 'Portugal', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}
const visitor: User = { ...owner, id: 'visitor-1', name: 'Mert Aydın', email: 'mert@metu.edu.tr', role: 'engineer' }

const inAMonth = new Date(Date.now() + 30 * 86400000).toISOString()

function makePost(extra: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    title: 'Midwife-led postpartum monitoring',
    authorId: owner.id,
    authorName: owner.name,
    authorRole: 'healthcare_professional',
    domain: 'Midwifery',
    domains: ['Midwifery', 'Nursing'],
    expertiseRequired: 'Signal processing',
    description: 'We want to detect postpartum haemorrhage risk early from wearable data.',
    projectStage: 'concept_validation',
    collaborationType: 'research_partner',
    levelOfCommitment: 'medium',
    confidentiality: 'public_pitch',
    city: 'Lisbon',
    country: 'Portugal',
    expiryDate: inAMonth,
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    interestCount: 2,
    meetingCount: 0,
    ...extra,
  }
}

const markPartnerFound = vi.fn()
const reopen = vi.fn()

// The page loads its post from the server (GET /posts/:id); comments come from their own endpoint.
async function renderAs(user: User, post: Post) {
  useAuthStore.setState({ user, isAuthenticated: true })
  usePostStore.setState({ markPartnerFound, reopen })
  useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  vi.mocked(api.get).mockImplementation(async (url: string) =>
    url === `/posts/${post.id}`
      ? { data: { success: true, data: post } }
      : { data: { success: true, data: { comments: [], total: 0, page: 1, pages: 1 } } })
  renderWithQuery(
    <MemoryRouter initialEntries={['/posts/post-1']}>
      <Routes>
        <Route path="/posts/:id" element={<PostDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findAllByText(post.title)
}

describe('PostDetailPage', () => {
  beforeEach(() => {
    markPartnerFound.mockReset().mockResolvedValue(undefined)
    reopen.mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('explains what Partner Found does and waits for confirmation', async () => {
    await renderAs(owner, makePost())

    fireEvent.click(screen.getByRole('button', { name: 'Mark partner found' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/will stop accepting meeting requests/i)).toBeInTheDocument()
    expect(markPartnerFound).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: /yes, mark partner found/i }))
    await waitFor(() => expect(markPartnerFound).toHaveBeenCalledWith('post-1'))
  })

  it('lets the author reopen a post that was marked Partner Found', async () => {
    await renderAs(owner, makePost({ status: 'partner_found' }))

    fireEvent.click(screen.getByRole('button', { name: 'Reopen post' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reopen post' }))

    await waitFor(() => expect(reopen).toHaveBeenCalledWith('post-1', undefined))
  })

  it('asks for a new expiry date before reopening a closed post that has expired', async () => {
    await renderAs(owner, makePost({ status: 'partner_found', expiryDate: '2026-01-01T00:00:00.000Z' }))

    fireEvent.click(screen.getByRole('button', { name: 'Reopen post' }))
    const dialog = screen.getByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Reopen post' })
    expect(confirm).toBeDisabled()

    fireEvent.change(within(dialog).getByLabelText('New expiry date'), { target: { value: '2031-05-01' } })
    fireEvent.click(confirm)

    await waitFor(() => expect(reopen).toHaveBeenCalledOnce())
    expect(reopen.mock.calls[0][1]).toMatch(/^2031-05-01/)
  })

  it('still takes meeting requests while a meeting is scheduled', async () => {
    await renderAs(visitor, makePost({ status: 'meeting_scheduled' }))
    expect(screen.getByRole('button', { name: 'Schedule a meeting' })).toBeInTheDocument()
  })

  it('points visitors of a closed post to the comments, where the author is notified', async () => {
    await renderAs(visitor, makePost({ status: 'partner_found' }))
    expect(screen.getByText(/the author is notified about comments/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /leave a note for the author/i })).toHaveAttribute('href', '#comments')
  })

  it('shows every domain the idea spans', async () => {
    await renderAs(visitor, makePost())
    expect(screen.getAllByText('Midwifery').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nursing').length).toBeGreaterThan(0)
  })

  it('marks domain names as English so a Turkish page does not capitalise them as "MİDWİFERY"', async () => {
    await renderAs(visitor, makePost())
    for (const name of ['Midwifery', 'Nursing']) {
      for (const element of screen.getAllByText(name)) {
        expect(element.closest('[lang]')).toHaveAttribute('lang', 'en')
      }
    }
  })

  it('says the post was not found when the server answers 404, instead of offering a retry', async () => {
    useAuthStore.setState({ user: visitor, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('Post not found'), { status: 404 }))
    renderWithQuery(
      <MemoryRouter initialEntries={['/posts/gone']}>
        <Routes><Route path="/posts/:id" element={<PostDetailPage />} /></Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText(i18n.t('postDetail.notFoundTitle'))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: i18n.t('postDetail.tryAgain') })).not.toBeInTheDocument()
  })

  it('offers a retry when loading fails for another reason', async () => {
    useAuthStore.setState({ user: visitor, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('Server error'), { status: 500 }))
    renderWithQuery(
      <MemoryRouter initialEntries={['/posts/post-1']}>
        <Routes><Route path="/posts/:id" element={<PostDetailPage />} /></Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('button', { name: i18n.t('postDetail.tryAgain') })).toBeInTheDocument()
  })

  it('speaks the interface language', async () => {
    await i18n.changeLanguage('tr')
    await renderAs(visitor, makePost())
    expect(screen.getByRole('button', { name: 'Toplantı planla' })).toBeInTheDocument()
  })
})
