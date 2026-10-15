import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import VerifyEmailPage from '../pages/auth/VerifyEmailPage'
import { useAuthStore } from '../store/authStore'

vi.mock('../lib/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
  API_BASE_URL: 'http://localhost:5000/api',
}))

vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ error: null, errorStatus: null, pendingVerificationEmail: null, verificationResent: false, registrationDraft: null })
  })

  const apiError = (message: string, status: number) => Object.assign(new Error(message), { status })

  it('explains a dead link in plain words instead of the server message', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError('This verification link is invalid or has expired', 400))
    render(<MemoryRouter initialEntries={['/verify-email?token=expired']}><VerifyEmailPage /></MemoryRouter>)

    expect(await screen.findByText(/Verification links work for 24 hours/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resend verification/i })).toBeInTheDocument()
  })

  it('sends someone who opens a used link to sign in rather than showing a failure', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError('This email address is already verified', 409))
    render(<MemoryRouter initialEntries={['/verify-email?token=used']}><VerifyEmailPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Already verified' })).toHaveFocus()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByText('Verification failed.')).not.toBeInTheDocument()
  })

  it('resends to the address just registered and offers to change a mistyped one', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    useAuthStore.setState({
      pendingVerificationEmail: 'alice@gmial.com',
      registrationDraft: { firstName: 'Alice', lastName: 'Kaya', email: 'alice@gmial.com', role: 'engineer', institution: 'Uni', city: 'Ankara', country: 'Türkiye' },
    })
    render(<MemoryRouter><VerifyEmailPage /></MemoryRouter>)

    expect(screen.queryByPlaceholderText('your.email@university.edu')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Change it' })).toHaveAttribute('href', '/register')

    fireEvent.click(screen.getByRole('button', { name: /resend verification/i }))
    expect(await screen.findByText(/link sent/i)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'alice@gmial.com' })
  })

  it('tells someone whose registration was already pending that a new link is on its way', () => {
    useAuthStore.setState({ pendingVerificationEmail: 'alice@university.edu', verificationResent: true })
    render(<MemoryRouter><VerifyEmailPage /></MemoryRouter>)

    expect(screen.getByText(/already waiting for verification/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /reset/i })).toHaveAttribute('href', '/forgot-password')
  })

  it('shows why resending failed instead of claiming the link was sent', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Account is already verified'))
    render(<MemoryRouter><VerifyEmailPage /></MemoryRouter>)

    fireEvent.change(screen.getByPlaceholderText('your.email@university.edu'), { target: { value: 'alice@university.edu' } })
    fireEvent.click(screen.getByRole('button', { name: /resend verification/i }))

    expect(await screen.findByText('Account is already verified')).toBeInTheDocument()
    expect(screen.queryByText(/link sent/i)).not.toBeInTheDocument()
  })

  it('shows the failure title in the interface language when the link is invalid', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Invalid or expired verification token'))
    render(<MemoryRouter initialEntries={['/verify-email?token=expired']}><VerifyEmailPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Verification failed.' })).toBeInTheDocument()
  })

  it('stays on the confirmation until the user chooses to continue', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { user: { id: 'alice', name: 'Alice' }, token: 'jwt' } } })
    render(
      <MemoryRouter initialEntries={['/verify-email?token=ok']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={<p>dashboard page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    const heading = await screen.findByRole('heading', { name: 'Email verified!' })
    expect(heading).toHaveFocus()
    await new Promise(resolve => setTimeout(resolve, 2000))
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
