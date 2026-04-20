import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const KEY = 'healthai_cookie_consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      setVisible(true)
      // Small delay so the slide-in transition plays on mount.
      const t = setTimeout(() => setMounted(true), 60)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = (type: 'all' | 'essential') => {
    localStorage.setItem(KEY, type)
    setMounted(false)
    setTimeout(() => setVisible(false), 220)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[300] px-4 pb-4 pointer-events-none font-body"
    >
      <div
        className={`pointer-events-auto mx-auto max-w-5xl bg-hai-plum text-hai-offwhite rounded-[1.75rem] shadow-[0_30px_80px_-20px_rgba(54,33,62,0.55)] border border-hai-plum overflow-hidden transition-all duration-300 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <div className="relative px-5 md:px-7 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Accent glow */}
          <div className="absolute -top-10 -left-10 w-48 h-48 pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />

          <div className="relative flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-hai-mint/15 text-hai-mint flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                cookie
              </span>
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.18em] uppercase text-hai-mint/80 font-bold mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-hai-mint" />
                GDPR · Essential cookies only
              </div>
              <p className="text-[13.5px] leading-relaxed text-hai-offwhite/90">
                We use only essential cookies for session management and security — no tracking, no analytics, no third-party scripts.{' '}
                <Link to={ROUTES.PRIVACY} className="text-hai-mint underline underline-offset-2 hover:text-white transition-colors">
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2 shrink-0 self-stretch md:self-auto">
            <button
              onClick={() => accept('essential')}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-transparent border border-hai-mint/30 text-hai-offwhite hover:bg-white/5 hover:border-hai-mint/60 rounded-full px-4 py-2.5 text-[11px] font-mono tracking-[0.12em] uppercase font-bold transition-colors whitespace-nowrap"
            >
              Essential only
            </button>
            <button
              onClick={() => accept('all')}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-hai-mint text-hai-plum hover:bg-white rounded-full px-5 py-2.5 text-[11px] font-mono tracking-[0.12em] uppercase font-bold transition-colors whitespace-nowrap shadow-[0_10px_30px_-10px_rgba(184,243,255,0.5)]"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
