import { useEffect, useState, useRef } from 'react'
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
    <PageWrapper maxWidth={440} padTop="clamp(48px,8vw,96px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Section label */}
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', gap: 16 }}>
          <span style={{ color: 'var(--primary)' }}>02</span>
          <span>Sign In</span>
          <span style={{ width: 4, height: 4, background: 'var(--ink-muted)', borderRadius: '50%', alignSelf: 'center', display: 'inline-block' }} />
          <span>Institutional access only</span>
        </div>

        <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(32px,5vw,48px)', letterSpacing: '-0.025em', margin: '0 0 8px', color: 'var(--ink)' }}>
          Welcome back.
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: 15, margin: '0 0 40px', lineHeight: 1.5 }}>
          Sign in with your institutional <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>.edu</span> account.
        </p>

        {/* Rate limit banner */}
        {cooldown > 0 && (
          <div role="alert" style={{ padding: '12px 16px', background: 'color-mix(in oklab, #d97706 8%, var(--paper))', border: '1px solid #d97706', marginBottom: 24, fontSize: 14, color: '#92400e', fontFamily: 'var(--ff-sans)' }}>
            <strong>Too many failed attempts.</strong> Please wait <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>{cooldown}s</span> before trying again.
            <div style={{ marginTop: 8, height: 3, background: 'oklch(0.93 0.07 75)', borderRadius: 2 }}>
              <div style={{ height: '100%', background: '#d97706', width: `${(cooldown / COOLDOWN_SEC) * 100}%`, transition: 'width 1s linear', borderRadius: 2 }} />
            </div>
          </div>
        )}

        {/* Attempt warning */}
        {failedAttempts > 0 && failedAttempts < RATE_LIMIT_AFTER && cooldown === 0 && (
          <div role="alert" style={{ padding: '10px 16px', background: 'color-mix(in oklab, #d97706 6%, var(--paper))', border: '1px solid #d97706', marginBottom: 16, fontSize: 13, color: '#92400e', fontFamily: 'var(--ff-sans)' }}>
            {RATE_LIMIT_AFTER - failedAttempts} attempt{RATE_LIMIT_AFTER - failedAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
          </div>
        )}

        {/* Server error banner */}
        {error && cooldown === 0 && (
          <div role="alert" style={{ padding: '12px 16px', background: 'color-mix(in oklab, #ef4444 8%, var(--paper))', border: '1px solid #ef4444', marginBottom: 24, fontSize: 14, color: '#ef4444', fontFamily: 'var(--ff-sans)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FormField label="Institutional email" error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              placeholder="you@university.edu"
              autoComplete="email"
              style={inputStyle(errors.email?.message)}
              onFocus={e => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'var(--primary)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${errors.email ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)'}` }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'var(--rule)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle(errors.password?.message)}
              onFocus={e => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'var(--primary)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${errors.password ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)'}` }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'var(--rule)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </FormField>

          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            style={{ marginTop: 8, padding: '13px 0', background: (isLoading || cooldown > 0) ? 'var(--ink-muted)' : 'var(--ink)', color: 'var(--paper)', border: 'none', fontFamily: 'var(--ff-sans)', fontSize: 15, fontWeight: 500, cursor: (isLoading || cooldown > 0) ? 'not-allowed' : 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            {isLoading ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                Signing in…
              </>
            ) : 'Sign in →'}
          </button>
        </form>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>No account?</span>
          <Link to={ROUTES.REGISTER} style={{ color: 'var(--primary)' }}>Request access →</Link>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 28, padding: '14px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
          <div style={{ color: 'var(--primary)', fontWeight: 500, marginBottom: 6, letterSpacing: '.14em', textTransform: 'uppercase' }}>Demo credentials</div>
          <div><b style={{ color: 'var(--ink)' }}>Healthcare Pro:</b> e.muller@charite.edu</div>
          <div><b style={{ color: 'var(--ink)' }}>Engineer:</b> m.rossi@polimi.edu</div>
          <div><b style={{ color: 'var(--ink)' }}>Admin:</b> admin@healthai.edu</div>
          <div style={{ marginTop: 4 }}>Password: <span style={{ color: 'var(--ink)' }}>password123</span> (admin: admin123)</div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}
