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
          <div className="w-14 h-14 rounded-full border-4 border-[#c4c4e0] border-t-[#3a3563] animate-spin mb-6" />
          <h1 className="font-headline font-black text-[32px] text-[#1c1a3c] mb-2">Verifying your email…</h1>
          <p className="text-[14px] text-[#7a7a9a]">Please wait a moment.</p>
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
              <circle cx="18" cy="18" r="18" fill="#22c55e" />
              <path d="M10 18l6 6 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-headline font-black text-[40px] text-[#1c1a3c] mb-3">Email verified!</h1>
          <p className="text-[14.5px] text-[#7a7a9a] mb-7 max-w-sm">Welcome aboard. Redirecting you to your dashboard…</p>
          <Link to={ROUTES.DASHBOARD} className="inline-flex items-center gap-2 bg-[#1c1a3c] text-white px-6 py-3 rounded-full font-bold text-[14px] hover:bg-black transition-colors">
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
          <h1 className="font-headline font-black text-[40px] leading-[1.05] text-[#1c1a3c] mb-3">
            Verification<br />failed<span className="text-[#7c6fcd]">.</span>
          </h1>
          <p className="text-[15px] text-[#7a7a9a] mb-8">{errorMsg ?? 'The link is invalid or has expired.'}</p>
          <ResendForm email={resendEmail} onChange={setResendEmail} onSubmit={handleResend} loading={resending} sent={resendSent} />
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-[#7c6fcd] font-bold text-[14px] hover:text-[#1c1a3c] transition-colors mt-6">
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
            <div className="w-[68px] h-[68px] rounded-full bg-[#e8e8f8] flex items-center justify-center">
              <svg width="30" height="26" viewBox="0 0 30 26" fill="none">
                <rect x="1" y="1" width="28" height="24" rx="3" stroke="#5c5a8c" strokeWidth="1.8" />
                <path d="M1 5l14 10L29 5" stroke="#5c5a8c" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full bg-[#3db8d8] border-2 border-white flex items-center justify-center">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h1 className="font-headline font-black text-[44px] md:text-[54px] leading-[1.05] tracking-[-0.02em] text-[#1c1a3c] mb-5">
            Check your<br />inbox<span className="text-[#7c6fcd]">.</span>
          </h1>

          <p className="text-[15px] text-[#6a6a8a] leading-relaxed mb-1">
            We've sent a verification link to
          </p>
          {pendingVerificationEmail && (
            <span className="inline-block bg-white border border-[#dde2ea] rounded-lg px-3 py-1.5 text-[13.5px] font-mono text-[#3a3563] font-semibold mb-4">
              {pendingVerificationEmail}
            </span>
          )}
          <p className="text-[15px] text-[#6a6a8a] leading-relaxed mb-8">
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
            className="inline-flex items-center gap-1.5 text-[#7c6fcd] font-bold text-[14px] hover:text-[#1c1a3c] transition-colors mt-6"
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
    <div className="min-h-screen bg-[#f0f0f8] font-body px-8 pt-14 pb-20">
      {children}
    </div>
  )
}

function StepBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5">
      <span className="w-2 h-2 rounded-full bg-[#3db8d8]" />
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#a0a8ba]">03</span>
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#3a3563]">Verify Email</span>
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
      <span className="block text-[10.5px] font-bold tracking-[0.2em] uppercase text-[#a0a8ba] mb-3">
        Didn't get the email?
      </span>
      <input
        type="email"
        value={email}
        onChange={e => onChange(e.target.value)}
        placeholder="your.email@university.edu"
        required
        className="w-full bg-[#f8f8fc] border border-[#e8e8f0] rounded-xl px-4 py-3 text-[14px] font-mono text-[#3a3563] outline-none focus:border-[#7c6fcd] focus:bg-white transition-all mb-3"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="inline-flex items-center gap-2.5 bg-[#1c1a3c] text-white px-5 py-2.5 rounded-full font-bold text-[13.5px] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {loading ? 'Sending…' : 'Resend verification'}
        </button>
        {sent && (
          <span className="text-[12.5px] text-[#22c55e] font-semibold">
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
        <rect x="72" y="55" width="76" height="5" rx="2.5" fill="#e8e8f8" />
        <rect x="72" y="67" width="56" height="5" rx="2.5" fill="#e8e8f8" />

        {/* Envelope front left flap */}
        <path d="M16 62 L110 130 L16 182" fill="#cccce8" />
        {/* Envelope front right flap */}
        <path d="M204 62 L110 130 L204 182" fill="#c4c4e0" />
        {/* Envelope bottom */}
        <path d="M16 182 L110 130 L204 182 Q204 182 204 182 L204 182 Q204 190 196 190 L24 190 Q16 190 16 182Z" fill="#c8c8e8" />

        {/* Green check circle */}
        <circle cx="130" cy="148" r="28" fill="#22c55e" />
        <path d="M119 148l8 8 14-14" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
