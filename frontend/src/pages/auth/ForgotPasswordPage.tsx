import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'
import api from '../../lib/api'

type Status = 'idle' | 'loading' | 'sent' | 'error'

const inputCls = 'w-full bg-hai-offwhite border border-neutral-200 rounded-xl px-4 py-3 text-[14px] font-mono text-hai-plum outline-none focus:border-hai-plum focus:bg-white focus:shadow-[0_0_0_3px_rgba(138,198,208,0.32)] transition-all'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError]   = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<TurnstileInstance>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setError(null)
    try {
      await api.post('/auth/forgot-password', { email: email.trim(), captchaToken: captchaToken ?? undefined })
      setStatus('sent')
    } catch (err) {
      captchaRef.current?.reset()
      setCaptchaToken(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'sent') {
    return (
      <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 rounded-3xl bg-hai-mint flex items-center justify-center mb-6 shadow-[0_20px_40px_-20px_rgba(54,33,62,0.3)]">
            <span className="material-symbols-outlined text-hai-plum text-[44px]" style={{ fontVariationSettings: '"FILL" 1' }}>forward_to_inbox</span>
          </div>
          <h1 className="font-headline font-bold text-[36px] text-hai-plum mb-3 leading-tight">Check your inbox.</h1>
          <p className="text-[14.5px] text-neutral-600 mb-8 max-w-sm leading-relaxed">
            If{' '}
            <span className="font-mono bg-hai-mint/60 text-hai-plum px-1.5 py-0.5 rounded font-bold">{email}</span>
            {' '}is registered and verified, we've sent a password reset link. The link expires in 1 hour.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3 rounded-full font-bold text-[14px] hover:bg-black transition-colors"
          >
            Back to sign in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper maxWidth={480} padTop="clamp(32px, 6vw, 64px)">
      {/* Section label */}
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">02</span>
        <span>Reset password</span>
      </div>

      <h1 className="font-headline font-bold text-[42px] md:text-[54px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-3">
        Forgot your<br />password<span className="text-hai-teal">?</span>
      </h1>
      <p className="text-[15px] text-neutral-600 leading-relaxed mb-8 max-w-md">
        Enter your institutional email and we'll send you a reset link.
      </p>

      <div className="bg-white rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] border border-neutral-100 p-6 md:p-8">
        {status === 'error' && error && (
          <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-xl shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
              Institutional email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              autoComplete="email"
              required
              className={inputCls}
            />
          </div>

          <div className="flex justify-center">
            <Turnstile
              ref={captchaRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              options={{ theme: 'light', size: 'normal' }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || !email.trim() || !captchaToken}
            className="mt-2 w-full py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending link…
              </>
            ) : (
              <>Send reset link <span aria-hidden="true">→</span></>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between text-[11px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold px-2">
        <span>Remembered it?</span>
        <Link to={ROUTES.LOGIN} className="text-hai-plum hover:text-hai-teal transition-colors">
          Back to sign in →
        </Link>
      </div>
    </PageWrapper>
  )
}
