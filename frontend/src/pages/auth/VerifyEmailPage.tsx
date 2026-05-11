import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'

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
        if (err) { setStatus('error'); setErrorMsg(err) }
        else { setStatus('success'); setTimeout(() => navigate(ROUTES.DASHBOARD), 1800) }
      } catch (e) {
        if (!mounted) return
        setStatus('error'); setErrorMsg((e as Error).message)
      }
    })()
    return () => { mounted = false }
  }, [token, verifyEmail, navigate])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResending(true); setResendSent(false)
    await resendVerification(resendEmail.trim())
    setResending(false); setResendSent(true)
  }

  if (status === 'verifying') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-14 h-14 rounded-full border-4 border-[#c4c4e0] border-t-[#36213E] animate-spin mb-6" />
          <h1 className="font-headline font-black text-3xl text-[#36213E] mb-2">Verifying your email…</h1>
          <p className="text-sm text-[#6F6878]">Please wait a moment.</p>
        </div>
      </PageShell>
    )
  }

  if (status === 'success') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-[#e8ffe8] flex items-center justify-center mb-6 shadow-[0_16px_40px_-16px_rgba(34,197,94,0.4)]">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#6FB8C4" />
              <path d="M10 18l6 6 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-headline font-black text-4xl text-[#36213E] mb-3">Email verified!</h1>
          <p className="text-sm text-[#6F6878] mb-7 max-w-sm">Welcome aboard. Redirecting you to your dashboard…</p>
          <Link to={ROUTES.DASHBOARD} className="inline-flex items-center gap-2 bg-[#36213E] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors">
            Go to dashboard →
          </Link>
        </div>
      </PageShell>
    )
  }

  if (status === 'error') {
    return (
      <PageShell>
        <div className="max-w-[520px]">
          <StepBadge />
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-7 mt-8">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#ef4444" strokeWidth="2" />
              <path d="M14 8v7M14 19v1" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-headline font-black text-4xl leading-tight text-[#36213E] mb-3">
            Verification<br />failed<span className="text-[#8AC6D0]">.</span>
          </h1>
          <p className="text-base text-[#6F6878] mb-8">{errorMsg ?? 'The link is invalid or has expired.'}</p>
          <ResendForm email={resendEmail} onChange={setResendEmail} onSubmit={handleResend} loading={resending} sent={resendSent} />
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-[#1B7A88] font-bold text-sm hover:text-[#36213E] transition-colors mt-6">
            Already verified? Sign in →
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="w-full max-w-[1060px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-12 items-start">

        {/* ── LEFT CONTENT ── */}
        <div>
          <StepBadge />

          {/* Mail icon with check */}
          <div className="relative w-[68px] h-[68px] mt-8 mb-8">
            <div className="w-[68px] h-[68px] rounded-full bg-[#E8F4F7] flex items-center justify-center">
              <svg width="30" height="26" viewBox="0 0 30 26" fill="none">
                <rect x="1" y="1" width="28" height="24" rx="3" stroke="#6F6878" strokeWidth="1.8" />
                <path d="M1 5l14 10L29 5" stroke="#6F6878" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full bg-[#8AC6D0] border-2 border-white flex items-center justify-center">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h1 className="font-headline font-black text-5xl md:text-6xl leading-tight tracking-normal text-[#36213E] mb-5">
            Check your<br />inbox<span className="text-[#8AC6D0]">.</span>
          </h1>

          <p className="text-base text-[#6F6878] leading-relaxed mb-1">
            We've sent a verification link to
          </p>
          {pendingVerificationEmail && (
            <span className="inline-block bg-white border border-[#D5DAE0] rounded-lg px-3 py-1.5 text-sm font-mono text-[#36213E] font-semibold mb-4">
              {pendingVerificationEmail}
            </span>
          )}
          <p className="text-base text-[#6F6878] leading-relaxed mb-8">
            Click the link to activate your account before signing in.<br />
            The link expires in 24 hours.
          </p>

          <ResendForm
            email={resendEmail}
            onChange={setResendEmail}
            onSubmit={handleResend}
            loading={resending}
            sent={resendSent}
          />

          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 text-[#1B7A88] font-bold text-sm hover:text-[#36213E] transition-colors mt-6"
          >
            Already verified? Sign in →
          </Link>
        </div>

        {/* ── RIGHT ILLUSTRATION ── */}
        <div className="hidden lg:flex items-center justify-center pt-12">
          <EnvelopeIllustration />
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] font-body px-8 pt-14 pb-20">
      {children}
    </div>
  )
}

function StepBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5">
      <span className="w-2 h-2 rounded-full bg-[#8AC6D0]" />
      <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6F6878]">03</span>
      <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#36213E]">Verify Email</span>
    </div>
  )
}

function ResendForm({ email, onChange, onSubmit, loading, sent }: {
  email: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  sent: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-[18px] border border-neutral-200 p-5 max-w-[460px]">
      <span className="block text-xs font-bold tracking-[0.16em] uppercase text-[#6F6878] mb-3">
        Didn't get the email?
      </span>
      <input
        type="email"
        value={email}
        onChange={e => onChange(e.target.value)}
        placeholder="your.email@university.edu"
        required
        className="w-full bg-[#F3F4F6] border border-[#E3E7EC] rounded-xl px-4 py-3 text-sm font-mono text-[#36213E] outline-none focus:border-[#8AC6D0] focus:bg-white transition-all mb-3"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="inline-flex items-center gap-2.5 bg-[#36213E] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {loading ? 'Sending…' : 'Resend verification'}
        </button>
        {sent && (
          <span className="text-xs text-[#6FB8C4] font-semibold">
            ✓ Link sent — check your inbox.
          </span>
        )}
      </div>
    </form>
  )
}

function EnvelopeIllustration() {
  return (
    <div className="relative w-[340px] h-[340px]">
      {/* Decorative background rings */}
      <div className="absolute left-[60px] top-[20px] w-[220px] h-[220px] rounded-full border border-[#d8d8ee] opacity-60" />
      <div className="absolute left-[30px] top-[-10px] w-[280px] h-[280px] rounded-full border border-[#e0e0f0] opacity-40" />

      {/* Floating dots */}
      <div className="absolute top-[28px] left-[52px] w-3 h-3 rounded-full bg-[#a0a0d8] opacity-50" />
      <div className="absolute top-[68px] right-[24px] w-2 h-2 rounded-full bg-[#b0c8e8] opacity-60" />
      <div className="absolute bottom-[60px] right-[18px] w-2.5 h-2.5 rounded-full bg-[#a8d8e8] opacity-50" />
      <div className="absolute bottom-[100px] left-[28px] w-1.5 h-1.5 rounded-full bg-[#9898c8] opacity-40" />

      {/* Sparkle top-right */}
      <svg className="absolute top-[52px] right-[56px] opacity-60" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v12M1 7h12M4 4l6 6M10 4L4 10" stroke="#9090c0" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {/* Envelope SVG */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="220"
        height="200"
        viewBox="0 0 220 200"
        fill="none"
      >
        {/* Envelope back */}
        <rect x="16" y="52" width="188" height="130" rx="10" fill="#b8b8e0" />

        {/* Letter (paper) sticking out */}
        <rect x="56" y="20" width="108" height="110" rx="8" fill="white" />
        <rect x="72" y="40" width="76" height="7" rx="3.5" fill="#e0e0f0" />
        <rect x="72" y="55" width="76" height="5" rx="2.5" fill="#E8F4F7" />
        <rect x="72" y="67" width="56" height="5" rx="2.5" fill="#E8F4F7" />

        {/* Envelope front left flap */}
        <path d="M16 62 L110 130 L16 182" fill="#cccce8" />
        {/* Envelope front right flap */}
        <path d="M204 62 L110 130 L204 182" fill="#c4c4e0" />
        {/* Envelope bottom */}
        <path d="M16 182 L110 130 L204 182 Q204 182 204 182 L204 182 Q204 190 196 190 L24 190 Q16 190 16 182Z" fill="#c8c8e8" />

        {/* Green check circle */}
        <circle cx="130" cy="148" r="28" fill="#6FB8C4" />
        <path d="M119 148l8 8 14-14" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
