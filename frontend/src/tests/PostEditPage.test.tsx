import { beforeEach, describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import PostEditPage from '../pages/posts/PostEditPage'
import { useAuthStore } from '../store/authStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }))

const author = {
  id: 'ana', name: 'Ana Costa', email: 'ana@ul.pt', role: 'healthcare_professional' as const, institution: 'ULisboa',
  city: 'Lisbon', country: 'Portugal', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
}

const post = {
  _id: 'p1', title: 'Postpartum early warning', authorId: 'ana', authorName: 'Ana Costa', authorRole: 'healthcare_professional',
  domain: 'Midwifery', domains: ['Midwifery'], expertiseRequired: 'Signal processing', description: 'Detect haemorrhage risk early.',
  projectStage: 'idea', collaborationType: 'research_partner', levelOfCommitment: 'medium', confidentiality: 'public_pitch',
  city: 'Lisbon', country: 'Portugal', expiryDate: '2031-01-01T00:00:00.000Z', status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z', interestCount: 0, meetingCount: 0,
}

describe('PostEditPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockImplementation(async (url: string) =>
      url === '/posts/p1' ? { data: { success: true, data: post } } : { data: { success: true, data: [] } })
    useAuthStore.setState({ user: author, isAuthenticated: true })
  })

  it('loads the post from the server when the edit link is opened directly', async () => {
    renderWithQuery(
      <MemoryRouter initialEntries={['/posts/p1/edit']}>
        <Routes><Route path="/posts/:id/edit" element={<PostEditPage />} /></Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByDisplayValue('Postpartum early warning')).toBeInTheDocument()
  })
})
