import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'
import api from '../../lib/api'

type Status = 'idle' | 'loading' | 'success' | 'error'

const inputCls = 'w-full bg-hai-offwhite border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono text-hai-plum outline-none focus:border-hai-plum focus:bg-white focus:shadow-[0_0_0_3px_rgba(138,198,208,0.32)] transition-all'

export default function ResetPasswordPage() {
  const [searchParams]        = useSearchParams()
  const navigate              = useNavigate()
  const token                 = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus]                 = useState<Status>('idle')
  const [error, setError]                   = useState<string | null>(null)

  // No token in URL → send to forgot-password
  useEffect(() => {
    if (!token) navigate(ROUTES.FORGOT_PASSWORD, { replace: true })
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setStatus('loading')
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      setStatus('success')
      setTimeout(() => navigate(ROUTES.LOGIN), 2500)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'The link is invalid or has expired.')
    }
  }

  if (status === 'success') {
    return (
      <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 rounded-3xl bg-hai-mint flex items-center justify-center mb-6 shadow-[0_20px_40px_-20px_rgba(54,33,62,0.3)]">
            <span className="material-symbols-outlined text-hai-plum text-5xl" style={{ fontVariationSettings: '"FILL" 1' }}>lock_reset</span>
          </div>
          <h1 className="font-headline font-bold text-4xl text-hai-plum mb-3 leading-tight">Password reset!</h1>
          <p className="text-sm text-neutral-600 mb-6 max-w-sm leading-relaxed">
            Your password has been updated. Redirecting you to sign in…
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
          >
            Sign in now <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper maxWidth={480} padTop="clamp(32px, 6vw, 64px)">
      {/* Section label */}
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-xs font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">02</span>
        <span>New password</span>
      </div>

      <h1 className="font-headline font-bold text-5xl md:text-6xl leading-tight tracking-normal text-hai-plum mb-3">
        Set a new<br />password<span className="text-hai-teal">.</span>
      </h1>
      <p className="text-base text-neutral-600 leading-relaxed mb-8 max-w-md">
        Choose a strong password with at least 8 characters.
      </p>

      <div className="bg-white rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] border border-neutral-100 p-6 md:p-8">
        {(status === 'error' || error) && (
          <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-xl shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
            <div className="flex-1">
              <p className="text-sm text-red-700 font-semibold">{error}</p>
              {status === 'error' && (
                <div className="mt-2">
                  <Link to={ROUTES.FORGOT_PASSWORD} className="text-hai-plum font-bold text-sm hover:underline inline-flex items-center gap-1">
                    Request a new reset link <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
              New password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(null) }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(null) }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || !newPassword || !confirmPassword}
            className="mt-2 w-full py-3.5 rounded-full bg-hai-plum text-white font-bold text-base hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating password…
              </>
            ) : (
              <>Update password <span aria-hidden="true">→</span></>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold px-2">
        <span>Changed your mind?</span>
        <Link to={ROUTES.LOGIN} className="text-hai-plum hover:text-hai-teal transition-colors">
          Back to sign in →
        </Link>
      </div>
    </PageWrapper>
  )
}
