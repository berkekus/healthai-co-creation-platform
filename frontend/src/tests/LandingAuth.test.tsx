import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import GuestRoute from '../router/GuestRoute'
import { useAuthStore } from '../store/authStore'
import { ROUTES } from '../constants/routes'
import i18n from '../i18n'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false })
})
afterEach(() => useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false }))

function signIn() {
  useAuthStore.setState({ isAuthenticated: true, user: { id: 'member', name: 'Member' } as NonNullable<ReturnType<typeof useAuthStore.getState>['user']> })
}

describe('landing authentication navigation', () => {
  it('shows member destinations and removes registration links on desktop and mobile', () => {
    signIn()
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    const nav = within(screen.getByRole('navigation'))
    expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', ROUTES.DASHBOARD)
    expect(nav.getByRole('link', { name: 'Find Projects' })).toHaveAttribute('href', ROUTES.POSTS)
    expect(nav.getByRole('link', { name: 'My Meeting Requests' })).toHaveAttribute('href', ROUTES.MEETINGS)
    expect(screen.queryByText('Request Access')).not.toBeInTheDocument()
    expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument()
    expect(document.querySelector(`a[href="${ROUTES.REGISTER}"]`)).toBeNull()
    fireEvent.click(nav.getByRole('button', { name: 'Toggle navigation menu' }))
    expect(screen.getAllByRole('link', { name: 'My Meeting Requests' })).toHaveLength(2)
  })

  it('keeps registration available to guests', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Request Access' })).toHaveAttribute('href', ROUTES.REGISTER)
  })
})

function registrationRoute() {
  return render(<MemoryRouter initialEntries={[ROUTES.REGISTER]}><Routes>
    <Route path={ROUTES.REGISTER} element={<GuestRoute><h1>Create account</h1></GuestRoute>} />
    <Route path={ROUTES.DASHBOARD} element={<h1>Member dashboard</h1>} />
  </Routes></MemoryRouter>)
}

it('redirects members away from account creation', () => {
  signIn()
  registrationRoute()
  expect(screen.getByText('Member dashboard')).toBeInTheDocument()
  expect(screen.queryByText('Create account')).not.toBeInTheDocument()
})
it('waits for session restoration before showing registration', () => {
  useAuthStore.setState({ isHydrating: true })
  registrationRoute()
  expect(screen.queryByText('Create account')).not.toBeInTheDocument()
})
it('allows guests to create an account', () => {
  registrationRoute()
  expect(screen.getByText('Create account')).toBeInTheDocument()
})
