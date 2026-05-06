import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import PageWrapper from '../../components/layout/PageWrapper'

type Status = 'idle' | 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail, resendVerification, pendingVerificationEmail } = useAuthStore()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState(pendingVerificationEmail ?? '')
  const [resendSent, setResendSent] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    ;(async () => {
      try {
        await verifyEmail(token)
        if (!mounted) return
        const err = useAuthStore.getState().error
        if (err) {
          setStatus('error')
          setErrorMsg(err)
        } else {
          setStatus('success')
          setTimeout(() => navigate(ROUTES.DASHBOARD), 1800)
        }
      } catch (e) {
        if (!mounted) return
        setStatus('error')
        setErrorMsg((e as Error).message)
      }
    })()
    return () => { mounted = false }
  }, [token, verifyEmail, navigate])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResending(true)
    setResendSent(false)
    await resendVerification(resendEmail.trim())
    setResending(false)
    setResendSent(true)
  }

  // Token verifying — show spinner
  if (status === 'verifying') {
    return (
      <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-16 h-16 rounded-full border-4 border-hai-plum/20 border-t-hai-plum animate-spin mb-6" />
          <h1 className="font-headline font-bold text-[28px] text-hai-plum mb-2">Verifying your email…</h1>
          <p className="text-[14px] text-neutral-600">Please wait a moment.</p>
        </div>
      </PageWrapper>
    )
  }

  // Token verified — success
  if (status === 'success') {
    return (
      <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 rounded-3xl bg-hai-mint flex items-center justify-center mb-6 shadow-[0_20px_40px_-20px_rgba(54,33,62,0.3)]">
            <span className="material-symbols-outlined text-hai-plum text-[44px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
          </div>
          <h1 className="font-headline font-bold text-[36px] text-hai-plum mb-3 leading-tight">Email verified!</h1>
          <p className="text-[14.5px] text-neutral-600 mb-6 max-w-md">Welcome aboard. Redirecting you to your dashboard…</p>
          <Link to={ROUTES.DASHBOARD} className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3 rounded-full font-bold text-[14px] hover:bg-black transition-colors">
            Go to dashboard <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageWrapper>
    )
  }

  // Token failed — show error + resend form
  if (status === 'error') {
    return (
      <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-red-500 text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
          </div>
          <h1 className="font-headline font-bold text-[32px] text-hai-plum mb-2">Verification failed</h1>
          <p className="text-[14px] text-neutral-600 mb-6">{errorMsg ?? 'The link is invalid or has expired.'}</p>
        </div>
        <ResendForm
          email={resendEmail}
          onChange={setResendEmail}
          onSubmit={handleResend}
          loading={resending}
          sent={resendSent}
        />
      </PageWrapper>
    )
  }

  // Default state: post-registration "check your inbox" + resend
  return (
    <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">03</span>
        <span>Verify Email</span>
      </div>

      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 bg-hai-mint rounded-3xl rotate-6" />
        <div className="absolute inset-0 bg-hai-plum rounded-3xl -rotate-3 flex items-center justify-center shadow-[0_20px_40px_-20px_rgba(54,33,62,0.45)]">
          <span className="material-symbols-outlined text-hai-mint text-[44px]" style={{ fontVariationSettings: '"FILL" 1' }}>mark_email_read</span>
        </div>
      </div>

      <h1 className="font-headline font-bold text-[36px] md:text-[48px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-4">
        Check your<br />inbox<span className="text-hai-teal">.</span>
      </h1>
      <p className="text-[15px] text-neutral-600 leading-relaxed mb-8 max-w-md">
        We've sent a verification link to{' '}
        {pendingVerificationEmail
          ? <span className="font-mono bg-hai-mint/60 text-hai-plum px-1.5 py-0.5 rounded font-bold">{pendingVerificationEmail}</span>
          : 'your email'
        }. Click the link to activate your account before signing in. The link expires in 24 hours.
      </p>

      <ResendForm
        email={resendEmail}
        onChange={setResendEmail}
        onSubmit={handleResend}
        loading={resending}
        sent={resendSent}
      />

      <div className="mt-6 flex items-center gap-3">
        <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-hai-plum font-semibold text-[14px] hover:underline">
          Already verified? Sign in <span aria-hidden="true">→</span>
        </Link>
      </div>
    </PageWrapper>
  )
}

function ResendForm({
  email, onChange, onSubmit, loading, sent,
}: {
  email: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  sent: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-[1.5rem] border border-neutral-100 p-5">
      <label className="block mb-3">
        <span className="block text-[10.5px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
          Didn't get the email?
        </span>
        <input
          type="email"
          value={email}
          onChange={e => onChange(e.target.value)}
          placeholder="your.email@university.edu"
          required
          className="w-full bg-hai-offwhite border border-neutral-200 rounded-xl px-4 py-3 text-[14px] font-mono text-hai-plum outline-none focus:border-hai-plum focus:bg-white transition-all"
        />
      </label>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-2.5 rounded-full font-bold text-[13px] hover:bg-black disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
          {loading ? 'Sending…' : 'Resend verification'}
        </button>
        {sent && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-hai-plum font-semibold">
            <span className="material-symbols-outlined text-[16px] text-hai-teal" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
            If the email is registered, a new link is on its way.
          </span>
        )}
      </div>
    </form>
  )
}
