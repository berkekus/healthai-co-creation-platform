import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import LandingPage from '../pages/LandingPage'
import UnauthorizedPage from '../pages/errors/UnauthorizedPage'
import { useAuthStore } from '../store/authStore'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

describe('interface text follows the selected language', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr')
  })
  afterEach(async () => {
    await i18n.changeLanguage('en')
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false })
  })

  it('labels the landing tour sketch in Turkish', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false })
    render(<MemoryRouter><LandingPage /></MemoryRouter>)

    expect(screen.getByText('Klinisyen profili')).toBeInTheDocument()
    expect(screen.getByText('Eşleşme ölçütü')).toBeInTheDocument()
    expect(screen.queryByText('Clinician profile')).not.toBeInTheDocument()
  })

  it('names the signed-in role in words on the access-denied page', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'ana', name: 'Ana', role: 'healthcare_professional' } as NonNullable<ReturnType<typeof useAuthStore.getState>['user']>,
    })
    render(<MemoryRouter initialEntries={['/unauthorized']}><UnauthorizedPage /></MemoryRouter>)

    expect(document.body).toHaveTextContent('Sağlık Profesyoneli')
    expect(document.body).not.toHaveTextContent('healthcare professional')
  })
})
