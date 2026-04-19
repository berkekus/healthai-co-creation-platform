import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const KEY = 'healthai_cookie_consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  const accept = (type: 'all' | 'essential') => {
    localStorage.setItem(KEY, type)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
        background: 'var(--ink)', color: 'var(--paper)',
        borderTop: '1px solid oklch(0.35 0.02 250)',
        padding: '18px clamp(16px,3vw,40px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 20, flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 260 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(0.65 0.01 240)', marginRight: 10 }}>
          GDPR ·
        </span>
        <span style={{ fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'oklch(0.88 0.005 240)', lineHeight: 1.5 }}>
          We use only essential cookies for session management and security. No tracking or analytics.{' '}
          <Link to={ROUTES.PRIVACY} style={{ color: 'oklch(0.78 0.08 75)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => accept('essential')}
          style={{
            fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'transparent', border: '1px solid oklch(0.45 0.02 250)',
            color: 'oklch(0.75 0.01 240)', padding: '8px 16px', cursor: 'pointer',
          }}
        >
          Essential only
        </button>
        <button
          onClick={() => accept('all')}
          style={{
            fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'var(--paper)', border: '1px solid var(--paper)',
            color: 'var(--ink)', padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
