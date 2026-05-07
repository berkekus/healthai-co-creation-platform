import { useRef, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Building2, ChevronDown, Eye, EyeOff, Lock, Mail, MapPin, Shield, User, Users } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuthStore } from '../../store/authStore'
import { registerSchema, type RegisterFormData } from '../../utils/validators'
import { ROUTES } from '../../constants/routes'
import { EU_COUNTRIES } from '../../constants/config'

type Step = 0 | 1 | 2
type PreselectedRole = 'engineer' | 'healthcare_professional'

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedRole = (location.state as { role?: PreselectedRole } | null)?.role
  const [step, setStep] = useState<Step>(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<TurnstileInstance>(null)

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const role = watch('role')

  useEffect(() => () => { clearError() }, [clearError])

  useEffect(() => {
    if (preselectedRole) setValue('role', preselectedRole)
  }, [preselectedRole, setValue])

  const nextStep = async () => {
    const fields: (keyof RegisterFormData)[][] = [
      ['name', 'email', 'password', 'confirm'],
      ['role'],
      ['institution', 'city', 'country'],
    ]
    const ok = await trigger(fields[step])
    if (!ok) return
    if (step === 0 && preselectedRole) {
      setStep(2)
    } else {
      setStep(s => (s + 1) as Step)
    }
  }

  const displaySteps = preselectedRole ? ['Account', 'Institution'] : ['Account', 'Role', 'Institution']
  const displayStep = preselectedRole ? (step === 0 ? 0 : 1) : step
  const roleLabel = preselectedRole === 'engineer' ? 'Engineer' : 'Healthcare Professional'

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      institution: data.institution,
      city: data.city,
      country: data.country,
      captchaToken: captchaToken ?? undefined,
    })
    if (useAuthStore.getState().error) {
      captchaRef.current?.reset()
      setCaptchaToken(null)
    } else {
      navigate(ROUTES.VERIFY_EMAIL)
    }
  }

  const inputCls = (hasError: boolean) =>
    `w-full py-3.5 rounded-[14px] border text-sm font-body text-[#18203a] placeholder:text-[#c5cad6] bg-white outline-none transition-all duration-150 ${
      hasError
        ? 'border-red-400 ring-2 ring-red-100'
        : 'border-[#dde2ea] focus:border-[#3db8d8] focus:ring-2 focus:ring-[#3db8d8]/15'
    }`

  return (
    <div className="min-h-screen bg-[#e8f0f7] flex items-center justify-center p-4 sm:p-8 font-body">
      <div className="w-full max-w-[1180px] flex rounded-[28px] overflow-hidden shadow-[0_32px_80px_-20px_rgba(14,30,66,0.22),0_0_0_1px_rgba(255,255,255,0.6)]">

        {/* ── LEFT PANEL ── */}
        <div
          className="login-left-panel hidden lg:flex w-[42%] flex-col relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle, #80b0cc 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 72%, rgba(255,255,255,0.72) 0%, rgba(180,218,242,0.28) 50%, transparent 70%)' }}
          />

          <div className="relative z-10 flex items-center gap-2.5 px-9 pt-9">
            <img src="/images/healthailogo.svg" alt="HealthAI logo" className="h-6 w-auto" />
            <span className="font-headline font-black text-lg tracking-normal text-[#1a3463]">healthai.</span>
          </div>

          <div className="relative z-10 px-9 pt-10">
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#4ca8cc] mb-5 font-headline">
              Co-Creation Platform
            </p>
            <h2 className="font-headline font-black text-3xl xl:text-4xl leading-tight text-[#152d5a]">
              Building the future<br />of healthcare,<br />
              <span className="text-[#3db8d8]">together.</span>
            </h2>
            <p className="mt-4 text-sm text-[#5a88a4] leading-relaxed font-body max-w-[260px]">
              Connect with clinicians and engineers<br />to create real-world impact.
            </p>
          </div>

          <div className="relative z-10 flex-1 flex items-end justify-center pb-16 px-6">
            <img
              src="/images/healthailogo3d.png"
              alt=""
              aria-hidden="true"
              className="w-[240px] xl:w-[290px]"
              style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 20px 40px rgba(20,70,160,0.22))' }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-center gap-4 px-6 pb-8 text-xs font-semibold text-[#5a88a4]">
            <div className="flex items-center gap-1.5"><Shield size={11} strokeWidth={2} />Secure &amp; Compliant</div>
            <div className="w-px h-3 bg-[#9ac0d8]/50" />
            <div className="flex items-center gap-1.5"><Lock size={11} strokeWidth={2} />Built in Europe</div>
            <div className="w-px h-3 bg-[#9ac0d8]/50" />
            <div className="flex items-center gap-1.5"><Users size={11} strokeWidth={2} />Zero Patient Data</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-white flex flex-col px-8 sm:px-12 py-10 overflow-y-auto">

          {/* Top bar */}
          <div className="flex items-center justify-end mb-8 shrink-0">
            <span className="text-sm text-[#9ca3b0] mr-3">Already have an account?</span>
            <Link
              to={ROUTES.LOGIN}
              className="px-4 py-2 rounded-full border border-[#dde2ea] text-sm font-bold text-[#18203a] hover:border-[#3db8d8] hover:text-[#3db8d8] transition-colors"
            >
              Sign in →
            </Link>
          </div>

          <div className="w-full max-w-[420px] mx-auto">

            {/* Heading */}
            <h1 className="font-headline font-black text-4xl sm:text-4xl leading-tight tracking-normal text-[#18203a] mb-2">
              Create your account<span className="text-[#3db8d8]">.</span>
            </h1>
            <p className="text-sm text-[#7a8399] mb-8 font-body">
              Join the directory and start collaborating.
            </p>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {displaySteps.map((label, i) => {
                const done = i < displayStep
                const active = i === displayStep
                return (
                  <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      active ? 'bg-[#1c1230] text-white'
                      : done  ? 'bg-[#3db8d8]/15 text-[#3db8d8]'
                      : 'bg-[#f4f5f7] text-[#a0a8ba]'
                    }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        active ? 'bg-white text-[#1c1230]'
                        : done  ? 'bg-[#3db8d8] text-white'
                        : 'border border-[#d0d5df] text-[#a0a8ba]'
                      }`}>
                        {done ? '✓' : i + 1}
                      </span>
                      <span className="tracking-[0.12em] uppercase">{label}</span>
                    </div>
                    {i < displaySteps.length - 1 && (
                      <div className={`flex-1 h-px ${done ? 'bg-[#3db8d8]' : 'bg-[#e8ecf0]'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Server error */}
            {error && (
              <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <span className="text-red-400 text-lg leading-none mt-0.5 shrink-0">✕</span>
                <div className="text-sm text-red-700 font-semibold">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* ── Step 0: Account ── */}
              {step === 0 && (
                <div className="flex flex-col gap-4">

                  <div>
                    <label className="block text-sm font-bold text-[#18203a] mb-2">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                        <User size={15} strokeWidth={1.8} />
                      </span>
                      <input
                        {...register('name')}
                        type="text"
                        placeholder="Dr. Jane Smith"
                        autoComplete="name"
                        className={`${inputCls(!!errors.name)} pl-11 pr-4`}
                      />
                    </div>
                    {errors.name && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.name.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-[#18203a]">Institutional email <span className="text-red-500">*</span></label>
                      <span className="text-xs font-bold tracking-[0.12em] uppercase text-[#a0a8ba]">.edu only</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                        <Mail size={15} strokeWidth={1.8} />
                      </span>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@university.edu"
                        autoComplete="email"
                        className={`${inputCls(!!errors.email)} pl-11 pr-4`}
                      />
                    </div>
                    {errors.email && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-[#18203a]">Password <span className="text-red-500">*</span></label>
                      <span className="text-xs font-bold tracking-[0.12em] uppercase text-[#a0a8ba]">min. 8 characters</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                        <Lock size={15} strokeWidth={1.8} />
                      </span>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`${inputCls(!!errors.password)} pl-11 pr-12`}
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] hover:text-[#6a7590] transition-colors" aria-label={showPassword ? 'Hide' : 'Show'}>
                        {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#18203a] mb-2">
                      Confirm password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                        <Lock size={15} strokeWidth={1.8} />
                      </span>
                      <input
                        {...register('confirm')}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`${inputCls(!!errors.confirm)} pl-11 pr-12`}
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] hover:text-[#6a7590] transition-colors" aria-label={showConfirm ? 'Hide' : 'Show'}>
                        {showConfirm ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                      </button>
                    </div>
                    {errors.confirm && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.confirm.message}</p>}
                  </div>

                  {preselectedRole && (
                    <div className="flex items-center gap-2.5 rounded-[14px] border border-[#3db8d8]/30 bg-[#edf9fc] px-4 py-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3db8d8] text-xs font-black text-white">✓</span>
                      <span className="text-sm font-semibold text-[#1c6278]">
                        Registering as: <span className="font-black">{roleLabel}</span>
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={nextStep}
                    className="mt-2 w-full py-[15px] rounded-full bg-[#1c1230] text-white text-base font-black tracking-normal font-headline hover:bg-[#110b1e] transition-all shadow-[0_12px_30px_-10px_rgba(28,18,48,0.65)]"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {/* ── Step 1: Role ── */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-bold text-[#18203a] mb-3">
                      I am a… <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-3">
                      {([
                        ['engineer', 'Engineer', 'ML, software, biomedical, robotics, signal processing…'],
                        ['healthcare_professional', 'Healthcare Professional', 'Clinician, doctor, nurse, researcher, health admin…'],
                      ] as const).map(([value, title, desc]) => {
                        const selected = role === value
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue('role', value, { shouldValidate: true })}
                            className={`text-left p-5 rounded-[18px] border-2 transition-all ${
                              selected ? 'border-[#1c1230] bg-[#f6f4ff]' : 'border-[#dde2ea] bg-white hover:border-[#3db8d8]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-headline font-bold text-base ${selected ? 'text-[#1c1230]' : 'text-[#18203a]'}`}>{title}</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-[#1c1230] bg-[#1c1230]' : 'border-[#c8cedd]'}`}>
                                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-[#7a8399] leading-relaxed">{desc}</p>
                          </button>
                        )
                      })}
                    </div>
                    {errors.role && <p className="mt-2 text-xs text-red-600 font-semibold">{errors.role.message}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(0)} className="flex-1 py-[15px] rounded-full border border-[#dde2ea] bg-white text-[#18203a] font-bold text-base hover:border-[#3db8d8] transition-colors font-headline">
                      ← Back
                    </button>
                    <button type="button" onClick={nextStep} className="flex-[2] py-[15px] rounded-full bg-[#1c1230] text-white font-black text-base hover:bg-[#110b1e] transition-all shadow-[0_12px_30px_-10px_rgba(28,18,48,0.65)] font-headline">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Institution ── */}
              {step === 2 && (
                <div className="flex flex-col gap-4">

                  <div>
                    <label className="block text-sm font-bold text-[#18203a] mb-2">
                      Institution <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                        <Building2 size={15} strokeWidth={1.8} />
                      </span>
                      <input
                        {...register('institution')}
                        type="text"
                        placeholder="Charité – Universitätsmedizin Berlin"
                        className={`${inputCls(!!errors.institution)} pl-11 pr-4`}
                      />
                    </div>
                    {errors.institution && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.institution.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-[#18203a] mb-2">City <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c0cc] pointer-events-none">
                          <MapPin size={15} strokeWidth={1.8} />
                        </span>
                        <input
                          {...register('city')}
                          type="text"
                          placeholder="Berlin"
                          className={`${inputCls(!!errors.city)} pl-11 pr-4`}
                        />
                      </div>
                      {errors.city && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#18203a] mb-2">Country <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          {...register('country')}
                          className={`${inputCls(!!errors.country)} appearance-none px-4 pr-9`}
                        >
                          <option value="">Select…</option>
                          {EU_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#b8c0cc]">
                          <ChevronDown size={15} strokeWidth={1.8} />
                        </span>
                      </div>
                      {errors.country && <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.country.message}</p>}
                    </div>
                  </div>

                  {/* GDPR */}
                  <label className="flex gap-3 items-start cursor-pointer mt-1" onClick={() => setGdprAccepted(g => !g)}>
                    <div className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      gdprAccepted ? 'bg-[#3db8d8] border-[#3db8d8]' : 'bg-white border-[#c8cedd] hover:border-[#3db8d8]'
                    }`}>
                      {gdprAccepted && (
                        <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                          <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[#6a7590] leading-relaxed font-body">
                      I have read and agree to the{' '}
                      <Link
                        to={ROUTES.PRIVACY}
                        className="font-bold text-[#18203a] hover:text-[#3db8d8] transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        Privacy Policy
                      </Link>
                      . I understand that my data will be processed in accordance with GDPR.
                    </span>
                  </label>

                  {/* Turnstile */}
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

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setStep(preselectedRole ? 0 : 1)} className="flex-1 py-[15px] rounded-full border border-[#dde2ea] bg-white text-[#18203a] font-bold text-base hover:border-[#3db8d8] transition-colors font-headline">
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !gdprAccepted || !captchaToken}
                      className="flex-[2] py-[15px] rounded-full bg-[#1c1230] text-white font-black text-base hover:bg-[#110b1e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_12px_30px_-10px_rgba(28,18,48,0.65)] font-headline flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating…
                        </>
                      ) : (
                        <>Create account →</>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
