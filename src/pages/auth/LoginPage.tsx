import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { loginSchema, type LoginFormData } from '../../utils/validators'
import { ROUTES } from '../../constants/routes'
import FormField, { inputStyle } from '../../components/ui/FormField'
import PageWrapper from '../../components/layout/PageWrapper'

const RATE_LIMIT_AFTER = 3
const COOLDOWN_SEC = 60

const FOCUS_SHADOW = '0 0 0 3px rgba(138,198,208,0.32)'   // hai-teal @ 32%
const ERROR_SHADOW = '0 0 0 3px rgba(220,38,38,0.18)'

const onInputFocus = (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#36213E'
  e.currentTarget.style.boxShadow = hasError ? ERROR_SHADOW : FOCUS_SHADOW
}
const onInputBlur = (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#E5E5E5'
  e.currentTarget.style.boxShadow = 'none'
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => { setFocus('email') }, [setFocus])
  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }) }, [isAuthenticated, navigate, from])
  useEffect(() => () => { clearError() }, [clearError])
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startCooldown = () => {
    setCooldown(COOLDOWN_SEC)
    timerRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); setFailedAttempts(0); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const onSubmit = async (data: LoginFormData) => {
    if (cooldown > 0) return
    await login(data)
    const newFails = failedAttempts + 1
    if (useAuthStore.getState().error) {
      if (newFails >= RATE_LIMIT_AFTER) { startCooldown() }
      else setFailedAttempts(newFails)
    } else {
      setFailedAttempts(0)
    }
  }

  return (
    <PageWrapper maxWidth={480} padTop="clamp(32px, 6vw, 64px)">
      {/* Section label */}
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">02</span>
        <span>Sign in</span>
      </div>

      {/* Headline */}
      <h1 className="font-headline font-bold text-[42px] md:text-[54px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-3">
        Welcome<br />back<span className="text-hai-teal">.</span>
      </h1>
      <p className="text-[15px] md:text-base text-neutral-600 leading-relaxed mb-8 max-w-md">
        Sign in with your institutional{' '}
        <span className="font-mono bg-hai-mint/60 text-hai-plum px-1.5 py-0.5 rounded font-bold">.edu</span>
        {' '}account.
      </p>

      {/* Card */}
      <div className="bg-white rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] border border-neutral-100 p-6 md:p-8">

        {/* Rate limit banner */}
        {cooldown > 0 && (
          <div role="alert" className="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-2xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>timer</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-900 mb-1">Too many failed attempts</div>
                <div className="text-[13px] text-amber-800">
                  Please wait <span className="font-mono font-bold">{cooldown}s</span> before trying again.
                </div>
                <div className="mt-2 h-1 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 transition-[width] duration-1000 ease-linear" style={{ width: `${(cooldown / COOLDOWN_SEC) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attempt warning */}
        {failedAttempts > 0 && failedAttempts < RATE_LIMIT_AFTER && cooldown === 0 && (
          <div role="alert" className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-800 font-medium">
            <span className="font-bold">{RATE_LIMIT_AFTER - failedAttempts}</span>
            {' '}attempt{RATE_LIMIT_AFTER - failedAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
          </div>
        )}

        {/* Server error banner */}
        {error && cooldown === 0 && (
          <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-xl shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
            <div className="text-sm text-red-700 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <FormField label="Institutional email" error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              placeholder="you@university.edu"
              autoComplete="email"
              style={inputStyle(errors.email?.message)}
              onFocus={onInputFocus(!!errors.email)}
              onBlur={onInputBlur(!!errors.email)}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle(errors.password?.message)}
              onFocus={onInputFocus(!!errors.password)}
              onBlur={onInputBlur(!!errors.password)}
            />
          </FormField>

          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className="mt-2 w-full py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5 font-body"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              <>Sign in <span aria-hidden="true">→</span></>
            )}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <div className="mt-6 flex items-center justify-between text-[11px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold px-2">
        <span>No account?</span>
        <Link to={ROUTES.REGISTER} className="text-hai-plum hover:text-hai-teal transition-colors">
          Request access →
        </Link>
      </div>

      {/* Demo credentials */}
      <div className="mt-6 p-5 bg-hai-cream/50 border border-hai-plum/10 rounded-2xl">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold mb-3">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>key</span>
          Demo credentials
        </div>
        <div className="space-y-1.5 text-[12.5px] font-body text-neutral-700 leading-relaxed">
          <div><span className="font-bold text-hai-plum">Healthcare Pro:</span> <span className="font-mono">e.muller@charite.edu</span></div>
          <div><span className="font-bold text-hai-plum">Engineer:</span> <span className="font-mono">m.rossi@polimi.edu</span></div>
          <div><span className="font-bold text-hai-plum">Admin:</span> <span className="font-mono">admin@healthai.edu</span></div>
          <div className="pt-1 mt-2 border-t border-hai-plum/10">
            Password: <span className="font-mono font-bold text-hai-plum">password123</span>
            <span className="text-neutral-500"> (admin: </span>
            <span className="font-mono font-bold text-hai-plum">admin123</span>
            <span className="text-neutral-500">)</span>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
