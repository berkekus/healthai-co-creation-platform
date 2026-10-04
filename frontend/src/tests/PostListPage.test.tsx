import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import PostListPage from '../pages/posts/PostListPage'
import { useAuthStore } from '../store/authStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/gemini', () => ({
  useSmartSuggestions: () => ({ suggestions: new Map(), isLoading: false, error: null, load: vi.fn(), reset: vi.fn() }),
}))

const ana = {
  id: 'ana', name: 'Ana Costa', email: 'ana.costa@ulisboa.pt', role: 'healthcare_professional' as const,
  institution: 'Universidade de Lisboa', city: 'Lisbon', country: 'Portugal', expertiseTags: [],
  createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

const post = (id: string, title: string) => ({
  _id: id, title, authorId: 'x', authorName: 'Someone', authorRole: 'engineer', domain: 'Cardiology', domains: ['Cardiology'],
  expertiseRequired: 'Signal processing', description: `${title} description`, projectStage: 'prototype',
  collaborationType: 'research_partner', confidentiality: 'public_pitch', city: 'Lisbon', country: 'Portugal',
  expiryDate: '2030-01-01T00:00:00.000Z', status: 'active', createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z', interestCount: 0, meetingCount: 0,
})

let listResponse = { posts: [post('p1', 'Prototype A')], total: 137, page: 1, limit: 5, pages: 28 }

function CurrentSearch() {
  return <p data-testid="search">{useLocation().search}</p>
}

const renderAt = (url: string) => renderWithQuery(
  <MemoryRouter initialEntries={[url]}>
    <Routes><Route path="/posts" element={<><PostListPage /><CurrentSearch /></>} /></Routes>
  </MemoryRouter>,
)

const listRequests = () => vi.mocked(api.get).mock.calls.map(c => c[0] as string).filter(u => u.startsWith('/posts?'))
const lastListRequest = () => listRequests().slice(-1)[0] ?? ''

describe('PostListPage (server-side list)', () => {
  beforeEach(() => {
    localStorage.clear()
    listResponse = { posts: [post('p1', 'Prototype A')], total: 137, page: 1, limit: 5, pages: 28 }
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockImplementation(async (url: string) =>
      url.startsWith('/posts?') ? { data: { success: true, data: listResponse } } : { data: { success: true, data: [] } })
    useAuthStore.setState({ user: ana, isAuthenticated: true })
  })

  it('restores filters from the URL into the server request, so coming back from a post keeps them', async () => {
    renderAt('/posts?stage=prototype&by=clinician&page=3')
    await screen.findByText('Prototype A')
    expect(lastListRequest()).toContain('projectStage=prototype')
    expect(lastListRequest()).toContain('authorRole=healthcare_professional')
    expect(lastListRequest()).toContain('page=3')
  })

  it('shows the total the server counted, not the length of what was downloaded', async () => {
    renderAt('/posts')
    await screen.findByText('Prototype A')
    expect(screen.getAllByText(/137/).length).toBeGreaterThan(0)
  })

  it('writes a changed filter to the URL, drops the page number and asks the server again', async () => {
    renderAt('/posts?page=2')
    await screen.findByText('Prototype A')

    fireEvent.click(screen.getByRole('button', { name: 'Clinician' }))

    expect(screen.getByRole('button', { name: 'Clinician' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Anyone' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('search')).toHaveTextContent('?by=clinician')
    await waitFor(() => expect(lastListRequest()).toContain('authorRole=healthcare_professional'))
    expect(lastListRequest()).not.toContain('page=2')
  })

  it('sends one search request after the user stops typing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderAt('/posts')
      await screen.findByText('Prototype A')
      const before = listRequests().length
      const box = screen.getByRole('searchbox')
      fireEvent.change(box, { target: { value: 'e' } })
      fireEvent.change(box, { target: { value: 'ec' } })
      fireEvent.change(box, { target: { value: 'ecg' } })
      await vi.advanceTimersByTimeAsync(350)
      await waitFor(() => expect(listRequests().length).toBe(before + 1))
      expect(lastListRequest()).toContain('search=ecg')
    } finally {
      vi.useRealTimers()
    }
  })

  it('moves to the last real page when the URL points past the end', async () => {
    listResponse = { posts: [], total: 6, page: 9, limit: 5, pages: 2 }
    renderAt('/posts?page=9')
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('page=2'))
  })
})
