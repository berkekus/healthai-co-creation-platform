import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import LoginPage from '../pages/auth/LoginPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import RegisterPage from '../pages/auth/RegisterPage'

vi.mock('../lib/prewarm', () => ({ prewarmBackend: vi.fn() }))

// Clicking a label must focus its field, and screen readers must announce the
// field by that label — the placeholder is not a name.
describe('auth form labels', () => {
  it('names the sign-in fields by their labels', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByLabelText('Institutional email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password')
  })

  it('names the forgotten-password email field by its label', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    expect(screen.getByLabelText(/^Institutional email/)).toHaveAttribute('type', 'email')
  })

  it('names both new-password fields by their labels', () => {
    render(<MemoryRouter initialEntries={['/reset-password?token=abc']}><ResetPasswordPage /></MemoryRouter>)
    expect(screen.getByLabelText(/^New password/)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/^Confirm password/)).toHaveAttribute('type', 'password')
  })

  it('names every account field on the registration form by its label', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    expect(screen.getByLabelText(/^First name/)).toHaveAttribute('autocomplete', 'given-name')
    expect(screen.getByLabelText(/^Last name/)).toHaveAttribute('autocomplete', 'family-name')
    expect(screen.getByLabelText(/^Email address/)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.getByLabelText(/^Confirm password/)).toHaveAttribute('autocomplete', 'new-password')
  })
})
