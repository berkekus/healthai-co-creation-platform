import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import '../i18n'
import PostCreatePage from '../pages/posts/PostCreatePage'
import { useAuthStore } from '../store/authStore'
import { usePostStore } from '../store/postStore'
import type { User } from '../types/auth.types'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const ana: User = {
  id: 'ana', name: 'Ana Costa', email: 'ana@ul.pt', role: 'healthcare_professional', institution: 'ULisboa',
  city: 'Lisbon', country: 'Portugal', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

const STORAGE_KEY = 'postCreateDraft:ana'
const create = vi.fn()
const publish = vi.fn()

function NoticeProbe() {
  const state = useLocation().state as { notice?: string } | null
  return <p data-testid="notice">{state?.notice ?? ''}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/posts/new']}>
      <Routes>
        <Route path="/posts/new" element={<PostCreatePage />} />
        <Route path="/posts/:id" element={<NoticeProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

const titleInput = () => screen.getByLabelText(/^Post title/) as HTMLInputElement

describe('PostCreatePage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    create.mockReset().mockResolvedValue({ id: 'new-post' })
    publish.mockReset().mockResolvedValue(undefined)
    useAuthStore.setState({ user: ana, isAuthenticated: true })
    usePostStore.setState({ create, publish })
  })

  it('keeps what was typed when the page reloads, and can start over', async () => {
    const first = renderPage()
    fireEvent.change(titleInput(), { target: { value: 'Postpartum monitoring' } })
    await waitFor(() => expect(sessionStorage.getItem(STORAGE_KEY)).toContain('Postpartum monitoring'))

    first.unmount()
    renderPage()

    expect(titleInput()).toHaveValue('Postpartum monitoring')
    expect(screen.getByRole('status')).toHaveTextContent('We kept what you had typed')

    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(titleInput().value).toBe('')
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toContain('Postpartum monitoring')
  })

  it('forgets the stored form and announces the result once the post is published', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      title: 'Postpartum monitoring', domains: ['Midwifery'], expertiseRequired: 'Signal processing',
      description: 'We want to detect postpartum haemorrhage risk early from wearable sensor data streams.',
      projectStage: 'idea', collaborationType: 'research_partner', levelOfCommitment: 'flexible',
      confidentiality: 'public_pitch', city: 'Lisbon', country: 'Portugal', expiryDate: '2030-01-01',
    }))
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /review & publish/i }))

    expect(await screen.findByTestId('notice')).toHaveTextContent('published')
    expect(publish).toHaveBeenCalledWith('new-post')
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
