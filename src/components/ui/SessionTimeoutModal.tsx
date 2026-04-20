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

  const totalSeconds = Math.round(SESSION_WARN_MS / 1000)

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warnRef.current)    clearTimeout(warnRef.current)
    if (countRef.current)   clearInterval(countRef.current)
    setShowWarning(false)
    setCountdown(totalSeconds)

    if (!isAuthenticated) return

    warnRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(totalSeconds)
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
  }, [isAuthenticated, logout, navigate, totalSeconds])

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

  const pct = Math.max(0, Math.min(100, (countdown / totalSeconds) * 100))
  const isCritical = countdown <= 20

  return (
    <div
      role="alertdialog"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-hai-plum/70 backdrop-blur-sm font-body"
    >
      <div className="bg-white w-full max-w-[460px] rounded-[2rem] shadow-[0_40px_120px_-20px_rgba(54,33,62,0.5)] overflow-hidden">
        <div className="relative px-7 pt-7 pb-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />

          <div className="relative">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-[10.5px] font-mono tracking-[0.16em] uppercase font-bold transition-colors ${
              isCritical ? 'bg-red-50 text-red-600' : 'bg-hai-lime text-hai-plum'
            }`}>
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                {isCritical ? 'warning' : 'schedule'}
              </span>
              Session · Timeout warning
            </div>

            <h2 id="session-timeout-title" className="font-headline font-bold text-[26px] leading-tight tracking-[-0.02em] text-hai-plum mb-3">
              Still there<span className="text-hai-teal">?</span>
            </h2>
            <p id="session-timeout-desc" className="text-[14px] text-neutral-600 leading-relaxed mb-5">
              You'll be signed out in{' '}
              <span className={`font-headline font-bold text-[20px] inline-block min-w-[2ch] text-center align-baseline ${
                isCritical ? 'text-red-600' : 'text-hai-plum'
              }`}>
                {countdown}
              </span>{' '}
              seconds due to inactivity.
            </p>

            {/* Progress bar */}
            <div
              className="h-1.5 bg-neutral-100 rounded-full mb-6 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalSeconds}
              aria-valuenow={countdown}
            >
              <div
                className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-hai-teal'}`}
                style={{ width: `${pct}%`, transitionProperty: 'width, background-color', transitionDuration: '1000ms, 500ms', transitionTimingFunction: 'linear, ease' }}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => { logout(); navigate(ROUTES.LOGIN) }}
                className="px-5 py-3 rounded-full bg-white border border-neutral-200 text-hai-plum text-[13px] font-bold hover:bg-neutral-100 transition-colors"
              >
                Sign out
              </button>
              <button
                onClick={reset}
                className="flex-1 px-5 py-3 rounded-full bg-hai-plum text-white text-[13px] font-bold hover:bg-black transition-colors inline-flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(54,33,62,0.4)]"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>refresh</span>
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
