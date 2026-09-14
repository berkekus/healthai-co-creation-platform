import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '../i18n'
import api from '../lib/api'
import CommentsSection from '../components/posts/CommentsSection'
import { useAuthStore } from '../store/authStore'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const ana = {
  id: 'ana', name: 'Ana Costa', email: 'ana.costa@ulisboa.pt', role: 'healthcare_professional' as const,
  institution: 'Universidade de Lisboa', city: 'Lisbon', country: 'Portugal', expertiseTags: [],
  createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

const elifsQuestion = {
  id: 'c1', postId: 'post-1', authorId: 'elif', authorName: 'Elif Kaya', authorRole: 'engineer',
  content: 'Do you already have labelled vital-sign data?', parentId: null, createdAt: new Date().toISOString(),
}

describe('CommentsSection', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: ana, isAuthenticated: true })
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { comments: [elifsQuestion], total: 1, page: 1, pages: 1 } } })
    vi.mocked(api.post).mockReset().mockResolvedValue({
      data: { success: true, data: { ...elifsQuestion, id: 'c2', authorId: 'ana', authorName: 'Ana Costa', content: 'Six months, anonymised.', parentId: 'c1' } },
    })
  })

  it('sends a reply to the comment it answers, with a named way to cancel it', async () => {
    render(<CommentsSection postId="post-1" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reply' }))
    expect(screen.getByRole('button', { name: 'Cancel reply' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Six months, anonymised.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/posts/post-1/comments', { content: 'Six months, anonymised.', parentId: 'c1' }))
    expect(await screen.findByText('Six months, anonymised.')).toBeInTheDocument()
  })
})
