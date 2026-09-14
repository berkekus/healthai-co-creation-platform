import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import i18n from '../i18n'
import api from '../lib/api'
import ProfilePage from '../pages/profile/ProfilePage'
import PublicProfilePage from '../pages/profile/PublicProfilePage'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth.types'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const baseUser: User = {
  id: 'u1', name: 'Ana Costa', email: 'ana.costa@gmail.com', role: 'healthcare_professional', institution: 'ULisboa',
  city: 'Lisbon', country: 'Portugal', bio: 'Midwife and researcher.', expertiseTags: ['Nursing'],
  createdAt: '2026-01-01T00:00:00.000Z', isVerified: true, isSuspended: false, lastActive: '',
}

const updateProfile = vi.fn()

function mockApi(providers = { github: true, linkedin: false }) {
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (url === '/auth/providers') return { data: { success: true, data: providers } }
    if (url.startsWith('/auth/users/')) return { data: { success: true, data: baseUser } }
    throw new Error('not mocked')
  })
}

function renderProfile(user: User = baseUser) {
  useAuthStore.setState({ user, isAuthenticated: true, updateProfile })
  return render(<MemoryRouter><ProfilePage /></MemoryRouter>)
}

describe('ProfilePage', () => {
  beforeEach(() => {
    updateProfile.mockReset().mockResolvedValue(undefined)
    mockApi()
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('shows profile strength tips in the interface language', async () => {
    await i18n.changeLanguage('tr')
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/ai/profile-score') {
        return { data: { success: true, data: { score: 57, suggestions: ['Upload a profile photo'], suggestionKeys: ['upload_photo'], source: 'rules' } } }
      }
      if (url === '/auth/providers') return { data: { success: true, data: { github: false, linkedin: false } } }
      throw new Error('not mocked')
    })

    renderProfile()

    expect(await screen.findByText('Profil fotoğrafı yükleyin')).toBeInTheDocument()
    expect(screen.queryByText('Upload a profile photo')).not.toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/ai/profile-score', { params: { lang: 'tr' } })
    // The score came from the built-in rules, so it is not labelled as AI.
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('keeps a save button within reach at the bottom of the form while editing', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }))

    const bar = screen.getByRole('region', { name: 'Save your profile' })
    expect(within(bar).getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('mentions unsaved changes only once something has been changed', async () => {
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }))
    const bar = screen.getByRole('region', { name: 'Save your profile' })
    expect(bar).not.toHaveTextContent(/unsaved changes/i)

    fireEvent.change(screen.getByLabelText('Position / title'), { target: { value: 'Clinical midwife' } })

    expect(await within(bar).findByText('You have unsaved changes')).toBeInTheDocument()
  })

  it('saves ORCID and institutional contact details', async () => {
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }))

    fireEvent.change(screen.getByLabelText('ORCID iD'), { target: { value: '0000-0002-1825-0097' } })
    fireEvent.change(screen.getByLabelText('Contact email'), { target: { value: 'midwifery@ul.pt' } })
    fireEvent.click(within(screen.getByRole('region', { name: 'Save your profile' })).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledOnce())
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ orcid: '0000-0002-1825-0097', contactEmail: 'midwifery@ul.pt' })
  })

  it('does not offer to connect a provider the server has not set up', async () => {
    renderProfile()

    const linkedin = (await screen.findByText('LinkedIn')).closest('div[data-provider]') as HTMLElement
    expect(within(linkedin).getByText('Not available yet')).toBeInTheDocument()
    expect(within(linkedin).getByRole('button')).toBeDisabled()

    const github = screen.getByText('GitHub').closest('div[data-provider]') as HTMLElement
    await waitFor(() => expect(within(github).getByRole('button', { name: 'Connect' })).toBeEnabled())
  })

  it('shows the institutional email badge only for institutional addresses', () => {
    renderProfile()
    expect(screen.queryByText('.edu / .gov')).not.toBeInTheDocument()
  })

  it('suggests midwifery when adding expertise', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }))

    fireEvent.change(screen.getByPlaceholderText(/search or type a tag/i), { target: { value: 'midw' } })

    expect(screen.getByRole('button', { name: 'Midwifery' })).toBeInTheDocument()
  })
})

describe('PublicProfilePage', () => {
  it('shows ORCID and institutional contact details as links', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.endsWith('/badges')) return { data: { success: true, data: { badges: [], collaborationScore: 0 } } }
      return {
        data: {
          success: true,
          data: {
            ...baseUser,
            position: 'Associate Professor',
            orcid: '0000-0002-1825-0097',
            contactEmail: 'midwifery@ul.pt',
            institutionWebsite: 'https://www.ulisboa.pt',
          },
        },
      }
    })
    render(
      <MemoryRouter initialEntries={['/profile/u1']}>
        <Routes><Route path="/profile/:userId" element={<PublicProfilePage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Associate Professor')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '0000-0002-1825-0097' })).toHaveAttribute('href', 'https://orcid.org/0000-0002-1825-0097')
    expect(screen.getByRole('link', { name: 'midwifery@ul.pt' })).toHaveAttribute('href', 'mailto:midwifery@ul.pt')
  })
})
