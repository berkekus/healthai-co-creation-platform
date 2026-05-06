import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Shield, Users } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { loginSchema, type LoginFormData } from '../../utils/validators'
import { ROUTES } from '../../constants/routes'

const RATE_LIMIT_AFTER = 3
const COOLDOWN_SEC = 60

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
      if (newFails >= RATE_LIMIT_AFTER) startCooldown()
      else setFailedAttempts(newFails)
    } else {
      setFailedAttempts(0)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8f0f7] flex items-center justify-center p-4 sm:p-8 font-body">
      <div className="w-full max-w-[1180px] flex rounded-[28px] overflow-hidden shadow-[0_32px_80px_-20px_rgba(14,30,66,0.22),0_0_0_1px_rgba(255,255,255,0.6)]">

        {/* ── LEFT PANEL ── */}
        <div
          className="hidden lg:flex w-[42%] flex-col relative overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #ddeef8 0%, #c8e2f4 45%, #b8d6ee 100%)' }}
        >
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #80b0cc 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Radial glow behind icon */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 72%, rgba(255,255,255,0.72) 0%, rgba(180,218,242,0.28) 50%, transparent 70%)' }}
          />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5 px-9 pt-9">
            <img src="/images/healthailogo.svg" alt="HealthAI logo" className="h-6 w-auto" />
            <span className="font-headline font-extrabold text-[17px] tracking-tight text-[#1a3463]">healthai.</span>
          </div>

          {/* Copy block */}
          <div className="relative z-10 px-9 pt-10">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#4ca8cc] mb-5 font-headline">
              Co-Creation Platform
            </p>
            <h2 className="font-headline font-black text-[30px] xl:text-[36px] leading-[1.14] text-[#152d5a]">
              Building the future<br />of healthcare,<br />
              <span className="text-[#3db8d8]">together.</span>
            </h2>
            <p className="mt-4 text-[14px] text-[#5a88a4] leading-relaxed font-body max-w-[260px]">
              Connect with clinicians and engineers<br />to create real-world impact.
            </p>
          </div>

          {/* Hero image — 3D logo with screen blend to hide dark bg */}
          <div className="relative z-10 flex-1 flex items-end justify-center pb-16 px-6">
            <img
              src="/images/healthailogo3d.png"
              alt=""
              aria-hidden="true"
              className="w-[200px] xl:w-[240px]"
              style={{
                mixBlendMode: 'screen',
                filter: 'drop-shadow(0 20px 40px rgba(20,70,160,0.22))',
              }}
            />
          </div>

          {/* Trust badges */}
          <div className="relative z-10 flex items-center justify-center gap-4 px-6 pb-8 text-[11px] font-semibold text-[#5a88a4]">
            <div className="flex items-center gap-1.5">
              <Shield size={11} strokeWidth={2} />
              Secure &amp; Compliant
            </div>
            <div className="w-px h-3 bg-[#9ac0d8]/50" />
            <div className="flex items-center gap-1.5">
              <Lock size={11} strokeWidth={2} />
              Built in Europe
            </div>
            <div className="w-px h-3 bg-[#9ac0d8]/50" />
            <div className="flex items-center gap-1.5">
              <Users size={11} strokeWidth={2} />
              Zero Patient Data
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-white flex items-center justify-center px-8 sm:px-12 py-12">
          <div className="w-full max-w-[380px]">

            {/* Heading */}
            <h1 className="font-headline font-black text-[36px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-[#18203a] mb-2">
              Welcome back<span className="text-[#3db8d8]">.</span>
            </h1>
            <p className="text-[14.5px] text-[#7a8399] mb-8 font-body">
              Sign in with your institutional{' '}
              <span className="text-[#3db8d8] font-bold">.edu</span>
              {' '}account.
            </p>

            {/* Rate-limit banner */}
            {cooldown > 0 && (
              <div role="alert" className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 text-lg leading-none mt-0.5">⏱</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-amber-900 mb-1">Too many failed attempts</div>
                    <div className="text-[12.5px] text-amber-800">
                      Please wait <span className="font-mono font-bold">{cooldown}s</span> before trying again.
                    </div>
                    <div className="mt-2 h-1 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-[width] duration-1000 ease-linear" style={{ width: `${(cooldown / COOLDOWN_SEC) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {failedAttempts > 0 && failedAttempts < RATE_LIMIT_AFTER && cooldown === 0 && (
              <div role="alert" className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px] text-amber-800 font-medium">
                <span className="font-bold">{RATE_LIMIT_AFTER - failedAttempts}</span>
                {' '}attempt{RATE_LIMIT_AFTER - failedAttempts !== 1 ? 's' : ''} remaining before lockout.
              </div>
            )}

            {error && cooldown === 0 && (
              <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <span className="text-red-400 text-lg leading-none mt-0.5 shrink-0">✕</span>
                <div className="text-[13px] text-red-700 font-medium flex-1">
                  {error}
                  {error.toLowerCase().includes('not verified') && (
                    <div className="mt-1.5">
                      <Link to={ROUTES.VERIFY_EMAIL} className="text-[#18203a] font-bold hover:underline text-[12.5px]">
                        Resend verification email →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

              {/* Email */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#18203a] mb-2">
                  Institutional email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                    <Mail size={15} strokeWidth={1.8} />
                  </span>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-[14px] border text-[14.5px] font-body text-[#18203a] placeholder:text-[#c5cad6] bg-white outline-none transition-all duration-150 ${
                      errors.email
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-[#dde2ea] focus:border-[#3db8d8] focus:ring-2 focus:ring-[#3db8d8]/15'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-[11.5px] text-red-600 font-medium">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#18203a] mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                    <Lock size={15} strokeWidth={1.8} />
                  </span>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full pl-11 pr-12 py-3.5 rounded-[14px] border text-[14.5px] font-body text-[#18203a] placeholder:text-[#c5cad6] bg-white outline-none transition-all duration-150 ${
                      errors.password
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-[#dde2ea] focus:border-[#3db8d8] focus:ring-2 focus:ring-[#3db8d8]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] hover:text-[#6a7590] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-[11.5px] text-red-600 font-medium">{errors.password.message}</p>}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between mt-0.5">
                <label
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                  onClick={() => setRememberMe(r => !r)}
                >
                  <div className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-[#3db8d8] border-[#3db8d8]' : 'bg-white border-[#c8cedd] hover:border-[#3db8d8]'
                  }`}>
                    {rememberMe && (
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                        <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[13.5px] text-[#6a7590] font-body">Remember me</span>
                </label>
                <Link
                  to={ROUTES.REGISTER}
                  className="text-[13.5px] font-semibold text-[#3db8d8] hover:text-[#18203a] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign in button */}
              <button
                type="submit"
                disabled={isLoading || cooldown > 0}
                className="mt-2 w-full flex items-center justify-center gap-2 py-[15px] rounded-full bg-[#1c1230] text-white text-[15px] font-black tracking-[-0.01em] font-headline hover:bg-[#110b1e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_12px_30px_-10px_rgba(28,18,48,0.65)]"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>Sign in <span className="ml-1" aria-hidden>→</span></>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-7 text-center text-[14px] text-[#9ca3b0] font-body">
              No account?{' '}
              <Link to={ROUTES.REGISTER} className="font-black text-[#18203a] hover:text-[#3db8d8] transition-colors">
                Request Access →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
