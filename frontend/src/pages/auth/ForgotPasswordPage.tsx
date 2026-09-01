import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { TURNSTILE_SITE_KEY, captchaConfigured, captchaBlocks } from '../../lib/turnstile'
import PageWrapper from '../../components/layout/PageWrapper'
import api from '../../lib/api'

type Status = 'idle' | 'loading' | 'sent' | 'error'

const inputCls = 'w-full bg-hai-offwhite border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono text-hai-plum outline-none focus:border-hai-plum focus:bg-white focus:shadow-[0_0_0_3px_rgba(138,198,208,0.32)] transition-all'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
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
      setError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  if (status === 'sent') {
    return (
      <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 rounded-3xl bg-hai-mint flex items-center justify-center mb-6 shadow-[0_20px_40px_-20px_rgba(54,33,62,0.3)]">
            <span className="material-symbols-outlined text-hai-plum text-5xl" style={{ fontVariationSettings: '"FILL" 1' }}>forward_to_inbox</span>
          </div>
          <h1 className="font-headline font-bold text-4xl text-hai-plum mb-3 leading-tight">{t('authPage.forgot.sentTitle')}</h1>
          <p className="text-sm text-neutral-600 mb-8 max-w-sm leading-relaxed">
            {t('authPage.forgot.sentDesc', { email })}
          </p>
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors">
            {t('authPage.forgot.backToSignIn2')}
          </Link>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper maxWidth={480} padTop="clamp(32px, 6vw, 64px)">
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-xs font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">02</span>
        <span>{t('auth.forgot.title')}</span>
      </div>

      <h1 className="font-headline font-bold text-5xl md:text-6xl leading-tight tracking-normal text-hai-plum mb-3">
        {t('authPage.forgot.heading')}<span className="text-hai-teal">?</span>
      </h1>
      <p className="text-base text-neutral-600 leading-relaxed mb-8 max-w-md">{t('authPage.forgot.sub')}</p>

      <div className="bg-white rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] border border-neutral-100 p-6 md:p-8">
        {status === 'error' && error && (
          <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-xl shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
              {t('authPage.forgot.emailLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('authPage.forgot.emailPlaceholder')}
              autoComplete="email"
              required
              className={inputCls}
            />
          </div>

          <div className="flex justify-center">
            {captchaConfigured && (<Turnstile
              ref={captchaRef}
              siteKey={TURNSTILE_SITE_KEY as string}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              options={{ theme: 'light', size: 'normal' }}
            />)}
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || !email.trim() || captchaBlocks(captchaToken)}
            className="mt-2 w-full py-3.5 rounded-full bg-hai-plum text-white font-bold text-base hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('authPage.forgot.submitting')}
              </>
            ) : t('authPage.forgot.submit')}
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold px-2">
        <span>{t('authPage.forgot.remembered')}</span>
        <Link to={ROUTES.LOGIN} className="text-hai-plum hover:text-hai-teal transition-colors">
          {t('authPage.forgot.backToSignIn')}
        </Link>
      </div>
    </PageWrapper>
  )
}
