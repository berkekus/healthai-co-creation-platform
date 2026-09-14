import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import RegisterPage from '../pages/auth/RegisterPage'
import { useAuthStore } from '../store/authStore'

function fillAccountStep(password: string, confirm: string) {
  const inputs = document.querySelectorAll('input')
  const byAutocomplete = (value: string) => Array.from(inputs).find(input => input.getAttribute('autocomplete') === value) as HTMLInputElement
  fireEvent.change(byAutocomplete('given-name'), { target: { value: 'Alice' } })
  fireEvent.change(byAutocomplete('family-name'), { target: { value: 'Smith' } })
  fireEvent.change(byAutocomplete('email'), { target: { value: 'alice@university.edu' } })
  const [passwordInput, confirmInput] = Array.from(inputs).filter(input => input.getAttribute('autocomplete') === 'new-password')
  fireEvent.change(passwordInput, { target: { value: password } })
  fireEvent.change(confirmInput, { target: { value: confirm } })
}

describe('RegisterPage — account step', () => {
  it('stays on the account step and explains the problem when the passwords differ', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillAccountStep('password123', 'different123')

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(screen.queryByText('I am a…')).not.toBeInTheDocument()
  })

  it('points to sign-in and password reset when the email already has an account', () => {
    useAuthStore.setState({ error: 'Email already registered', errorStatus: 409 })
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/already has an account/i)
    expect(screen.getByRole('link', { name: /reset your password/i })).toHaveAttribute('href', '/forgot-password')
  })

  it('offers the roles as a named choice and the privacy consent as a real checkbox', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillAccountStep('password123', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    const roles = await screen.findByRole('group', { name: /I am a/ })
    const engineer = within(roles).getByRole('button', { name: /^Engineer/ })
    expect(engineer).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(engineer)
    expect(engineer).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    const consent = await screen.findByRole('checkbox', { name: /privacy policy/i })
    expect(consent).not.toBeChecked()
    fireEvent.click(consent)
    expect(consent).toBeChecked()
  })

  it('moves on to the role step when the passwords match', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillAccountStep('password123', 'password123')

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(screen.getByText('I am a…')).toBeInTheDocument())
  })
})
