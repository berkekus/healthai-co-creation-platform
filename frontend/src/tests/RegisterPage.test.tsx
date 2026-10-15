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

  const emailInput = () => document.querySelector('input[autocomplete="email"]') as HTMLInputElement

  it('suggests the likely address when the email domain looks mistyped', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fireEvent.change(emailInput(), { target: { value: 'alice@gmial.com' } })

    fireEvent.click(await screen.findByRole('button', { name: 'Did you mean alice@gmail.com?' }))
    await waitFor(() => expect(emailInput()).toHaveValue('alice@gmail.com'))
    expect(screen.queryByRole('button', { name: /did you mean/i })).not.toBeInTheDocument()
  })

  it('explains an email domain the server could not find', () => {
    useAuthStore.setState({ error: 'This email domain does not appear to exist.', errorStatus: 422 })
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't find this email domain/i)
  })

  it('refills the form, but not the passwords, when coming back to change the email', () => {
    useAuthStore.setState({
      error: null, errorStatus: null,
      registrationDraft: { firstName: 'Alice', lastName: 'Smith', email: 'alice@gmial.com', role: 'engineer', institution: 'Uni', city: 'Ankara', country: 'Türkiye' },
    })
    render(<MemoryRouter initialEntries={[{ pathname: '/register', state: { changeEmail: true } }]}><RegisterPage /></MemoryRouter>)

    expect(emailInput()).toHaveValue('alice@gmial.com')
    expect(emailInput()).toHaveFocus()
    expect(document.querySelector('input[autocomplete="given-name"]')).toHaveValue('Alice')
    for (const input of document.querySelectorAll('input[autocomplete="new-password"]')) expect(input).toHaveValue('')
  })

  it('moves on to the role step when the passwords match', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillAccountStep('password123', 'password123')

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(screen.getByText('I am a…')).toBeInTheDocument())
  })
})
