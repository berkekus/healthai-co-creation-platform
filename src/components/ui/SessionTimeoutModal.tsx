import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import { SESSION_TIMEOUT_MS, SESSION_WARN_MS } from '../../constants/config'

export default function SessionTimeoutModal() {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warnRef.current)    clearTimeout(warnRef.current)
    if (countRef.current)   clearInterval(countRef.current)
    setShowWarning(false)
    setCountdown(60)

    if (!isAuthenticated) return

    warnRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(Math.round(SESSION_WARN_MS / 1000))
      countRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(countRef.current!); return 0 }
          return c - 1
        })
      }, 1000)
    }, SESSION_TIMEOUT_MS - SESSION_WARN_MS)

    timeoutRef.current = setTimeout(() => {
      logout()
      navigate(ROUTES.LOGIN)
    }, SESSION_TIMEOUT_MS)
  }, [isAuthenticated, logout, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warnRef.current)    clearTimeout(warnRef.current)
      if (countRef.current)   clearInterval(countRef.current)
    }
  }, [isAuthenticated, reset])

  if (!showWarning) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.48)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: 40, maxWidth: 420, width: '90%', boxShadow: '0 24px 64px rgba(15,23,42,0.16)' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 16 }}>
          Session · Timeout Warning
        </div>
        <h2 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--ink)' }}>
          Still there?
        </h2>
        <p style={{ color: 'var(--ink-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
          You'll be signed out in <strong style={{ color: 'var(--ink)', fontFamily: 'var(--ff-mono)', fontSize: 18 }}>{countdown}</strong> seconds due to inactivity.
        </p>
        <div style={{ height: 3, background: 'var(--rule)', marginBottom: 28, borderRadius: 2 }}>
          <div style={{ height: '100%', background: countdown > 20 ? 'var(--primary)' : '#ef4444', width: `${(countdown / 60) * 100}%`, transition: 'width 1s linear, background .5s', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={reset} style={{ flex: 1, padding: '11px 0', background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)', fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Stay signed in
          </button>
          <button onClick={() => { logout(); navigate(ROUTES.LOGIN) }} style={{ padding: '11px 20px', background: 'transparent', color: 'var(--ink-muted)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-sans)', fontSize: 14, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
