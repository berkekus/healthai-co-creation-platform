import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import '../i18n'
import PostListPage from '../pages/posts/PostListPage'
import { useAuthStore } from '../store/authStore'
import { usePostStore } from '../store/postStore'
import type { Post } from '../types/post.types'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/gemini', () => ({
  useSmartSuggestions: () => ({ suggestions: new Map(), isLoading: false, error: null, load: vi.fn(), reset: vi.fn() }),
}))

const ana = {
  id: 'ana', name: 'Ana Costa', email: 'ana.costa@ulisboa.pt', role: 'healthcare_professional' as const,
  institution: 'Universidade de Lisboa', city: 'Lisbon', country: 'Portugal', expertiseTags: [],
  createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

function post(id: string, title: string, projectStage: Post['projectStage'], authorRole: Post['authorRole']): Post {
  return {
    id, title, authorId: `author-${id}`, authorName: 'Someone', authorRole, domain: 'Cardiology', domains: ['Cardiology'],
    expertiseRequired: 'Signal processing', description: `${title} description`, projectStage,
    collaborationType: 'research_partner', confidentiality: 'public_pitch', city: 'Lisbon', country: 'Portugal',
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z', interestCount: 0, meetingCount: 0,
  } as Post
}

function CurrentSearch() {
  return <p data-testid="search">{useLocation().search}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/posts" element={<><PostListPage /><CurrentSearch /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PostListPage filters', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: ana, isAuthenticated: true })
    usePostStore.setState({
      posts: [
        post('p1', 'Prototype by an engineer', 'prototype', 'engineer'),
        post('p2', 'Idea by a clinician', 'idea', 'healthcare_professional'),
      ],
      isLoading: false,
      fetchPosts: vi.fn(),
    })
  })

  it('restores filters from the URL, so coming back from a post keeps them', () => {
    renderAt('/posts?stage=prototype')

    expect(screen.getByText('Prototype by an engineer')).toBeInTheDocument()
    expect(screen.queryByText('Idea by a clinician')).not.toBeInTheDocument()
  })

  it('writes a changed filter to the URL and drops the page number', () => {
    renderAt('/posts?page=2')

    fireEvent.click(screen.getByRole('button', { name: 'Clinician' }))

    expect(screen.getByRole('button', { name: 'Clinician' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Anyone' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('search')).toHaveTextContent('?by=clinician')
    expect(screen.getByText('Idea by a clinician')).toBeInTheDocument()
    expect(screen.queryByText('Prototype by an engineer')).not.toBeInTheDocument()
  })
})
