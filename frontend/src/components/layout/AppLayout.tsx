import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import FloatingChat from './FloatingChat'
import SessionTimeoutModal from '../ui/SessionTimeoutModal'
import CookieConsentBanner from '../ui/CookieConsentBanner'
import ErrorBoundary from '../ui/ErrorBoundary'
import SlowServerNotice from '../ui/SlowServerNotice'
/**
 * Shell for all authenticated-app pages.
 */
export default function AppLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col font-body bg-hai-offwhite antialiased">
      <Navbar />
      <SlowServerNotice />
      <div className="flex-1">
        {/* A crashing page keeps the navbar usable; moving to another route clears the error. */}
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
      <FloatingChat />
      <Footer />
      <SessionTimeoutModal />
      <CookieConsentBanner />
    </div>
  )
}
