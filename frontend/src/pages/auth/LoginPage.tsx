import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Shield, Users, Stethoscope, Wrench, ShieldCheck } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { createLoginSchema, type LoginFormData } from '../../utils/validators'
import { ROUTES } from '../../constants/routes'
import { TURNSTILE_SITE_KEY, captchaConfigured, captchaBlocks } from '../../lib/turnstile'
import { prewarmBackend } from '../../lib/prewarm'
import { useSlowRequestHint } from '../../hooks/useSlowRequestHint'

// Dev-only quick-login shortcuts — never shipped in a production build.
// import.meta.env.DEV is statically false in `vite build`, so this whole
// array (and the credentials in it) is dead-code-eliminated from the bundle.
const DEV_ACCOUNTS = import.meta.env.DEV ? [
  { label: 'Doctor',    email: 'elif.kaya@istanbul.edu.tr', password: 'HealthAI2026!', icon: Stethoscope, color: '#0ea5e9' },
  { label: 'Engineer',  email: 'mert.aydin@metu.edu.tr',   password: 'HealthAI2026!', icon: Wrench,      color: '#8b5cf6' },
  { label: 'Admin',     email: 'admin@healthai.edu',        password: 'Admin1234!',    icon: ShieldCheck, color: '#f97316' },
] : []

const RATE_LIMIT_AFTER = 3
const COOLDOWN_SEC = 60

export default function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const quickLoginRef = useRef(false)
  const captchaRef = useRef<TurnstileInstance>(null)

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
  })

  // Wake the sleeping API container while the user is still typing, so the
  // login POST doesn't have to absorb the cold start.
  useEffect(() => { prewarmBackend() }, [])
  const isSlow = useSlowRequestHint(isLoading)

  useEffect(() => { setFocus('email') }, [setFocus])
  useEffect(() => {
    if (isAuthenticated) navigate(quickLoginRef.current ? ROUTES.DASHBOARD : from, { replace: true })
  }, [isAuthenticated, navigate, from])
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
    await login({ ...data, captchaToken: captchaToken ?? undefined, rememberMe })
    const newFails = failedAttempts + 1
    if (useAuthStore.getState().error) {
      captchaRef.current?.reset()
      setCaptchaToken(null)
      if (newFails >= RATE_LIMIT_AFTER) startCooldown()
      else setFailedAttempts(newFails)
    } else {
      setFailedAttempts(0)
    }
  }

  const quickLogin = (email: string, password: string) => {
    if (isLoading || captchaBlocks(captchaToken)) return
    quickLoginRef.current = true
    login({ email, password, captchaToken: captchaToken ?? undefined, rememberMe: true })
  }

  return (
    <div className="min-h-screen bg-[#e8f0f7] dark:bg-hai-offwhite flex items-center justify-center p-4 sm:p-8 font-body">
      <div className="w-full max-w-[1180px] flex rounded-[28px] overflow-hidden shadow-[0_32px_80px_-20px_rgba(14,30,66,0.22),0_0_0_1px_rgba(255,255,255,0.6)] dark:shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]">

        {/* LEFT PANEL */}
        <div
          className="login-left-panel hidden lg:flex w-[42%] flex-col relative overflow-hidden"
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
          <div className="relative z-10 flex items-center px-9 pt-9">
            <img src="/images/healthailogo.svg" alt="HealthAI" className="h-7 w-auto" />
          </div>

          {/* Copy block */}
          <div className="relative z-10 px-9 pt-10">
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#4ca8cc] mb-5 font-headline">
              {t('authPage.platform')}
            </p>
            <h2 className="font-headline font-black text-3xl xl:text-4xl leading-tight text-[#152d5a]">
              {t('authPage.tagline')}
            </h2>
            <p className="mt-4 text-sm text-[#5a88a4] leading-relaxed font-body max-w-[260px]">
              {t('authPage.desc')}
            </p>
          </div>

          {/* Hero image - 3D logo with screen blend to hide dark bg */}
          <div className="relative z-10 flex-1 flex items-end justify-center pb-16 px-6">
            <img
              src="/images/healthailogo3d.png"
              alt=""
              aria-hidden="true"
              className="w-[240px] xl:w-[290px]"
              style={{
                mixBlendMode: 'screen',
                filter: 'drop-shadow(0 20px 40px rgba(20,70,160,0.22))',
              }}
            />
          </div>

          {/* Trust badges */}
          <div className="relative z-10 flex items-center justify-center gap-4 px-6 pb-8 text-xs font-semibold text-[#5a88a4]">
            <div className="flex items-center gap-1.5">
              <Shield size={11} strokeWidth={2} />
              {t('authPage.secure')}
            </div>
            <div className="w-px h-3 bg-[#9ac0d8]/50" />
            <div className="flex items-center gap-1.5">
              <Lock size={11} strokeWidth={2} />
              {t('authPage.europe')}
            </div>
            <div className="w-px h-3 bg-[#9ac0d8]/50" />
            <div className="flex items-center gap-1.5">
              <Users size={11} strokeWidth={2} />
              {t('authPage.noPatient')}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white dark:bg-[rgb(var(--surface-card))] flex items-center justify-center px-8 sm:px-12 py-12">
          <div className="w-full max-w-[380px]">

            {/* Heading */}
            <h1 className="font-headline font-black text-4xl sm:text-5xl leading-tight tracking-normal text-[#36213E] dark:text-hai-plum mb-2">
              {t('authPage.login.heading')}<span className="text-[#8AC6D0]">.</span>
            </h1>
            <p className="text-sm text-[#6F6878] dark:text-[rgb(var(--text-secondary))] mb-8 font-body">
              {t('authPage.login.sub')}
            </p>

            {/* Rate-limit banner */}
            {cooldown > 0 && (
              <div role="alert" className="mb-5 p-4 bg-hai-cream/40 border border-hai-cream rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="text-hai-plum text-lg leading-none mt-0.5">{'\u23f1'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-hai-plum mb-1">{t('authPage.login.tooMany')}</div>
                    <div className="text-xs text-hai-plum/70">
                      {t('authPage.login.waitSeconds', { count: cooldown })}
                    </div>
                    <div className="mt-2 h-1 bg-hai-cream rounded-full overflow-hidden">
                      <div className="h-full bg-hai-plum transition-[width] duration-1000 ease-linear" style={{ width: `${(cooldown / COOLDOWN_SEC) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {failedAttempts > 0 && failedAttempts < RATE_LIMIT_AFTER && cooldown === 0 && (
              <div role="alert" className="mb-5 p-3 bg-hai-cream/40 border border-hai-cream rounded-xl text-xs text-hai-plum/75 font-semibold">
                {t('authPage.login.attemptsLeft', { count: RATE_LIMIT_AFTER - failedAttempts })}
              </div>
            )}

            {error && cooldown === 0 && (
              <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <span className="text-red-400 text-lg leading-none mt-0.5 shrink-0">{'\u00d7'}</span>
                <div className="text-sm text-red-700 font-semibold flex-1">
                  {error}
                  {error.toLowerCase().includes('not verified') && (
                    <div className="mt-1.5">
                      <Link to={ROUTES.VERIFY_EMAIL} className="text-[#36213E] font-bold hover:underline text-xs">
                        {t('authPage.login.resendVerification')}
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
                <label className="block text-sm font-bold text-[#36213E] dark:text-hai-plum mb-2">
                  {t('authPage.login.emailLabel')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                    <Mail size={15} strokeWidth={1.8} />
                  </span>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder={t('authPage.login.emailPlaceholder')}
                    autoComplete="email"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-[14px] border text-sm font-body text-[#36213E] dark:text-hai-plum placeholder:text-[#c5cad6] bg-white dark:bg-[rgb(var(--surface-blob))] outline-none transition-all duration-150 ${
                      errors.email
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-[#D5DAE0] dark:border-[rgb(var(--border-default))] focus:border-[#8AC6D0] focus:ring-2 focus:ring-[#8AC6D0]/15'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-[#36213E] dark:text-hai-plum mb-2">
                  {t('authPage.login.passwordLabel')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                    <Lock size={15} strokeWidth={1.8} />
                  </span>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                    autoComplete="current-password"
                    className={`w-full pl-11 pr-12 py-3.5 rounded-[14px] border text-sm font-body text-[#36213E] dark:text-hai-plum placeholder:text-[#c5cad6] bg-white dark:bg-[rgb(var(--surface-blob))] outline-none transition-all duration-150 ${
                      errors.password
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-[#D5DAE0] dark:border-[rgb(var(--border-default))] focus:border-[#8AC6D0] focus:ring-2 focus:ring-[#8AC6D0]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] hover:text-[#6a7590] transition-colors"
                    aria-label={showPassword ? t('authPage.login.hidePassword') : t('authPage.login.showPassword')}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.password.message}</p>}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between mt-0.5">
                <label
                  htmlFor="rememberMe"
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <div className={`relative w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-[#8AC6D0] border-[#8AC6D0]' : 'bg-white border-[#c8cedd] hover:border-[#8AC6D0]'
                  }`}>
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    {rememberMe && (
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden>
                        <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#6a7590] dark:text-[rgb(var(--text-secondary))] font-body">{t('authPage.login.rememberMe')}</span>
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm font-semibold text-[#1B7A88] hover:text-[#36213E] transition-colors"
                >
                  {t('authPage.login.forgotPassword')}
                </Link>
              </div>

              {/* Turnstile */}
              <div className="flex flex-col items-center gap-2">
                {captchaConfigured && (<Turnstile
                  ref={captchaRef}
                  siteKey={TURNSTILE_SITE_KEY as string}
                  onSuccess={token => { setCaptchaToken(token); setCaptchaError(false) }}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => { setCaptchaToken(null); setCaptchaError(true) }}
                  options={{ theme: 'light', size: 'normal' }}
                />)}
                {captchaError && (
                  <div role="alert" className="flex items-center gap-2 text-xs font-semibold text-red-600">
                    <span>{t('authPage.login.captchaFailed')}</span>
                    <button
                      type="button"
                      onClick={() => { setCaptchaError(false); captchaRef.current?.reset() }}
                      className="underline hover:no-underline"
                    >
                      {t('authPage.login.retry')}
                    </button>
                  </div>
                )}
              </div>

              {/* Sign in button */}
              <button
                type="submit"
                disabled={isLoading || cooldown > 0 || captchaBlocks(captchaToken)}
                className="mt-2 w-full flex items-center justify-center gap-2 py-[15px] rounded-full bg-[#1c1230] text-white text-base font-black tracking-normal font-headline hover:bg-[#110b1e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_12px_30px_-10px_rgba(28,18,48,0.65)]"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('authPage.login.submitting')}
                  </>
                ) : (
                  t('authPage.login.submit')
                )}
              </button>

              {isSlow && (
                <p role="status" className="-mt-1 text-center text-xs font-semibold text-neutral-500">
                  {t('authPage.wakingServer')}
                </p>
              )}
            </form>

            {/* Footer */}
            <p className="mt-7 text-center text-sm text-[#9ca3b0] dark:text-[rgb(var(--text-secondary))] font-body">
              {t('authPage.login.noAccount')}{' '}
              <Link to={ROUTES.REGISTER} className="font-black text-[#36213E] dark:text-hai-plum hover:text-[#8AC6D0] transition-colors">
                {t('authPage.login.createAccount')}
              </Link>
            </p>

            {/* Dev quick-login — dev builds only, stripped from production */}
            {import.meta.env.DEV && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-[#eef0f5] dark:bg-[rgb(var(--border-default))]" />
                  <span className="text-xs font-bold tracking-[0.12em] uppercase text-[#c5cad6] dark:text-[rgb(var(--text-secondary))] font-headline">Dev Access</span>
                  <div className="flex-1 h-px bg-[#eef0f5] dark:bg-[rgb(var(--border-default))]" />
                </div>
                {!captchaToken && (
                  <p className="mb-2 text-center text-[10px] text-[#c5cad6] font-semibold">
                    Complete the security check above to enable quick login
                  </p>
                )}
                <div className="flex gap-2">
                  {DEV_ACCOUNTS.map(({ label, email, password, icon: Icon, color }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => quickLogin(email, password)}
                      disabled={isLoading || captchaBlocks(captchaToken)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] border border-[#eef0f5] dark:border-[rgb(var(--border-default))] bg-[#fafbfc] dark:bg-[rgb(var(--surface-blob))] hover:bg-white dark:hover:bg-[rgb(var(--surface-card))] hover:border-[#D5DAE0] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Icon size={14} strokeWidth={2} style={{ color }} />
                      </div>
                      <span className="text-xs font-bold text-[#4a5270] dark:text-[rgb(var(--text-secondary))] font-headline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
