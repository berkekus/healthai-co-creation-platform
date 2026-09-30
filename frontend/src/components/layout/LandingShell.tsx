import { Outlet, useLocation } from 'react-router-dom'
import SessionTimeoutModal from '../ui/SessionTimeoutModal'
import CookieConsentBanner from '../ui/CookieConsentBanner'
import ErrorBoundary from '../ui/ErrorBoundary'

/**
 * Minimal wrapper for the public landing page.
 * The landing page renders its own nav + footer (Faz 0 co-creation refresh),
 * so we only inject the global utilities here.
 */
export default function LandingShell() {
  const location = useLocation()
  return (
    <>
      <ErrorBoundary resetKey={location.pathname}>
        <Outlet />
      </ErrorBoundary>
      <SessionTimeoutModal />
      <CookieConsentBanner />
    </>
  )
}
