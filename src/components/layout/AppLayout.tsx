import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SessionTimeoutModal from '../ui/SessionTimeoutModal'
import CookieConsentBanner from '../ui/CookieConsentBanner'

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      <Footer />
      <SessionTimeoutModal />
      <CookieConsentBanner />
    </div>
  )
}
