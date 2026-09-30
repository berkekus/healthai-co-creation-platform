import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNetworkStore } from '../../store/networkStore'

const SLOW_AFTER_MS = 3000

/**
 * App-wide explanation for a slow first request: the API's free Render instance sleeps
 * after ~15 minutes idle and takes ~20s to wake. Any page benefits without wiring it in;
 * pages that already explain the wait inline (sign-in, registration) suppress it.
 */
export default function SlowServerNotice() {
  const { t } = useTranslation()
  const busy = useNetworkStore(s => s.pending > 0)
  const pageExplainsIt = useNetworkStore(s => s.inlineHints > 0)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!busy) {
      setSlow(false)
      return
    }
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(id)
  }, [busy])

  const visible = slow && !pageExplainsIt

  // The live region stays mounted so screen readers announce the text when it appears.
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[88px] z-40 flex justify-center px-4">
      {visible && (
        <p className="max-w-xl rounded-full bg-hai-plum px-5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_16px_40px_-16px_rgba(54,33,62,0.6)]">
          {t('authPage.wakingServer')}
        </p>
      )}
    </div>
  )
}
