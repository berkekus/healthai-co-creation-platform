import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    useAuthStore.setState({ error: null, errorStatus: null, pendingVerificationEmail: null, verificationResent: false })
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
})
