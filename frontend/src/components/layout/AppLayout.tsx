import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SessionTimeoutModal from '../ui/SessionTimeoutModal'
import CookieConsentBanner from '../ui/CookieConsentBanner'

/**
 * Shell for all authenticated-app pages (Faz 1 refresh).
 * Uses the hai-offwhite surface + Source Sans 3 body font to match the landing.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col font-body bg-hai-offwhite antialiased">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <SessionTimeoutModal />
      <CookieConsentBanner />
    </div>
  )
}
