import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { registerSchema, type RegisterFormData } from '../../utils/validators'
import { ROUTES } from '../../constants/routes'
import { EU_COUNTRIES } from '../../constants/config'
import FormField, { inputStyle } from '../../components/ui/FormField'
import PageWrapper from '../../components/layout/PageWrapper'

const STEPS = ['Account', 'Role', 'Institution'] as const
type Step = 0 | 1 | 2

const FOCUS_SHADOW = '0 0 0 3px rgba(138,198,208,0.32)'
const ERROR_SHADOW = '0 0 0 3px rgba(220,38,38,0.18)'

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(0)

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const role = watch('role')

  useEffect(() => () => { clearError() }, [clearError])

  const nextStep = async () => {
    const fields: (keyof RegisterFormData)[][] = [
      ['name', 'email', 'password', 'confirm'],
      ['role'],
      ['institution', 'city', 'country'],
    ]
    const ok = await trigger(fields[step])
    if (ok) setStep(s => (s + 1) as Step)
  }

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      institution: data.institution,
      city: data.city,
      country: data.country,
    })
    navigate(ROUTES.VERIFY_EMAIL)
  }

  const inputProps = (name: keyof RegisterFormData) => ({
    ...register(name),
    style: inputStyle(errors[name]?.message),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = errors[name] ? '#DC2626' : '#36213E'
      e.currentTarget.style.boxShadow = errors[name] ? ERROR_SHADOW : FOCUS_SHADOW
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = errors[name] ? '#DC2626' : '#E5E5E5'
      e.currentTarget.style.boxShadow = 'none'
    },
  })

  return (
    <PageWrapper maxWidth={560} padTop="clamp(32px, 5vw, 56px)">
      {/* Section label */}
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">01</span>
        <span>Request access</span>
        <span className="w-1 h-1 rounded-full bg-hai-plum/30" />
        <span className="text-neutral-500 normal-case tracking-normal font-semibold">.edu only</span>
      </div>

      {/* Headline */}
      <h1 className="font-headline font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-8">
        Join the<br />directory<span className="text-hai-teal">.</span>
      </h1>

      {/* Step indicator — pill-style */}
      <div className="flex items-center gap-3 mb-8" role="list">
        {STEPS.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={label} className="flex items-center gap-3 flex-1 last:flex-none" role="listitem">
              <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full transition-colors ${
                active ? 'bg-hai-plum text-white'
                : done ? 'bg-hai-mint text-hai-plum'
                : 'bg-white border border-neutral-200 text-neutral-400'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                  active ? 'bg-white text-hai-plum'
                  : done ? 'bg-hai-plum text-hai-mint'
                  : 'border border-neutral-300 text-neutral-400'
                }`}>
                  {done ? '✓' : i + 1}
                </span>
                <span className="text-[11px] font-mono tracking-[0.14em] uppercase font-bold">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${done ? 'bg-hai-plum' : 'bg-neutral-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Server error */}
      {error && (
        <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600 text-xl shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
          <div className="text-sm text-red-700 font-medium">{error}</div>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] border border-neutral-100 p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <FormField label="Full name" error={errors.name?.message} required>
                <input {...inputProps('name')} type="text" placeholder="Dr. Jane Smith" autoComplete="name" />
              </FormField>

              <FormField label="Institutional email" error={errors.email?.message} required hint=".edu only">
                <input {...inputProps('email')} type="email" placeholder="you@university.edu" autoComplete="email" />
              </FormField>

              <FormField label="Password" error={errors.password?.message} required hint="min. 8 characters">
                <input {...inputProps('password')} type="password" placeholder="••••••••" autoComplete="new-password" />
              </FormField>

              <FormField label="Confirm password" error={errors.confirm?.message} required>
                <input {...inputProps('confirm')} type="password" placeholder="••••••••" autoComplete="new-password" />
              </FormField>

              <button
                type="button"
                onClick={nextStep}
                className="mt-3 w-full py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 1: Role ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[13px] font-bold text-hai-plum mb-3 font-body">
                  I am a… <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    ['engineer', 'Engineer', 'ML, software, biomedical, robotics, signal processing…', 'memory'],
                    ['healthcare_professional', 'Healthcare Professional', 'Clinician, doctor, nurse, researcher, health admin…', 'stethoscope'],
                  ] as const).map(([value, title, desc, icon]) => {
                    const selected = role === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue('role', value, { shouldValidate: true })}
                        className={`text-left p-5 rounded-2xl border-2 transition-all font-body ${
                          selected
                            ? 'border-hai-plum bg-gradient-to-br from-hai-mint/60 to-white shadow-[0_10px_30px_-10px_rgba(54,33,62,0.25)]'
                            : 'border-neutral-200 bg-white hover:border-hai-teal'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-hai-plum text-hai-mint' : 'bg-hai-mint/40 text-hai-plum'}`}>
                            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-hai-plum bg-hai-plum' : 'border-neutral-300'}`}>
                            {selected && <div className="w-2 h-2 rounded-full bg-hai-mint" />}
                          </div>
                        </div>
                        <div className={`font-headline font-bold text-lg mb-1 ${selected ? 'text-hai-plum' : 'text-neutral-900'}`}>
                          {title}
                        </div>
                        <div className="text-[12.5px] text-neutral-600 leading-relaxed">
                          {desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.role && (
                  <span role="alert" className="block mt-2 text-[12px] text-red-600 font-medium">{errors.role.message}</span>
                )}
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 py-3.5 rounded-full border border-neutral-300 bg-white text-neutral-800 font-semibold text-[15px] hover:bg-neutral-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-[2] py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Institution ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <FormField label="Institution" error={errors.institution?.message} required>
                <input {...inputProps('institution')} type="text" placeholder="Charité – Universitätsmedizin Berlin" />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="City" error={errors.city?.message} required>
                  <input {...inputProps('city')} type="text" placeholder="Berlin" />
                </FormField>
                <FormField label="Country" error={errors.country?.message} required>
                  <select
                    {...inputProps('country')}
                    style={{
                      ...inputStyle(errors.country?.message),
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M1 1l5 5 5-5' stroke='%2336213E' fill='none' stroke-width='1.5' stroke-linecap='round'/></svg>")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 36,
                    }}
                  >
                    <option value="">Select…</option>
                    {EU_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>

              {/* GDPR consent */}
              <label className="flex gap-3 items-start cursor-pointer p-4 border border-neutral-200 bg-hai-offwhite rounded-2xl hover:border-hai-teal transition-colors">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-[18px] h-[18px] accent-[#36213E] flex-shrink-0 cursor-pointer"
                />
                <span className="text-[13.5px] text-neutral-700 leading-relaxed font-body">
                  I have read and agree to the{' '}
                  <Link to={ROUTES.PRIVACY} className="text-hai-plum font-bold underline decoration-hai-teal decoration-2 underline-offset-2 hover:text-hai-teal transition-colors">
                    Privacy Policy
                  </Link>
                  . I understand that my data will be processed in accordance with GDPR.
                </span>
              </label>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-full border border-neutral-300 bg-white text-neutral-800 font-semibold text-[15px] hover:bg-neutral-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
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

      {/* Footer link */}
      <div className="mt-6 flex items-center justify-between text-[11px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold px-2">
        <span>Already have an account?</span>
        <Link to={ROUTES.LOGIN} className="text-hai-plum hover:text-hai-teal transition-colors">
          Sign in →
        </Link>
      </div>
    </PageWrapper>
  )
}
