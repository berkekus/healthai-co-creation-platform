import { Outlet } from 'react-router-dom'
import SessionTimeoutModal from '../ui/SessionTimeoutModal'
import CookieConsentBanner from '../ui/CookieConsentBanner'

/**
 * Minimal wrapper for the public landing page.
 * The landing page renders its own nav + footer (Faz 0 co-creation refresh),
 * so we only inject the global utilities here.
 */
export default function LandingShell() {
  return (
    <>
      <Outlet />
      <SessionTimeoutModal />
      <CookieConsentBanner />
    </>
  )
}
