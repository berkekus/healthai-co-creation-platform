import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

vi.mock('../lib/api', () => ({ default: { post: vi.fn() } }))

function renderPage() {
  render(<MemoryRouter initialEntries={['/reset-password?token=abc']}><ResetPasswordPage /></MemoryRouter>)
  return {
    password: screen.getByLabelText(/^New password/),
    confirm: screen.getByLabelText(/^Confirm password/),
  }
}

describe('ResetPasswordPage password rules', () => {
  it('states the length rule before anything is typed and ties it to the field', () => {
    const { password } = renderPage()
    expect(password).toHaveAccessibleDescription('Password must be at least 8 characters.')
  })

  it('tells whether the confirmation matches while the user types', () => {
    const { password, confirm } = renderPage()

    fireEvent.change(password, { target: { value: 'longenough' } })
    fireEvent.change(confirm, { target: { value: 'longenou' } })
    expect(confirm).toHaveAccessibleDescription('Passwords do not match.')

    fireEvent.change(confirm, { target: { value: 'longenough' } })
    expect(confirm).toHaveAccessibleDescription('Passwords match.')
  })

  it('says nothing about matching until the confirmation field has input', () => {
    const { confirm } = renderPage()
    expect(confirm).toHaveAccessibleDescription('')
  })
})
