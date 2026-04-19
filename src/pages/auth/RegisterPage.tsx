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
      e.currentTarget.style.borderColor = errors[name] ? '#ef4444' : 'var(--primary)'
      e.currentTarget.style.boxShadow = `0 0 0 3px ${errors[name] ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)'}`
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = errors[name] ? '#ef4444' : 'var(--rule)'
      e.currentTarget.style.boxShadow = 'none'
    },
  })

  return (
    <PageWrapper maxWidth={520} padTop="clamp(40px,6vw,80px)">
      {/* Section label */}
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', gap: 16 }}>
        <span style={{ color: 'var(--primary)' }}>01</span>
        <span>Request access</span>
        <span style={{ width: 4, height: 4, background: 'var(--ink-muted)', borderRadius: '50%', alignSelf: 'center', display: 'inline-block' }} />
        <span>.edu accounts only</span>
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-0.025em', margin: '0 0 32px', color: 'var(--ink)' }}>
        Join the directory.
      </h1>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, border: `1.5px solid ${i <= step ? 'var(--primary)' : 'var(--rule)'}`, background: i < step ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontSize: 10, color: i < step ? 'var(--paper)' : i === step ? 'var(--primary)' : 'var(--ink-muted)', flexShrink: 0 }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: i === step ? 'var(--ink)' : 'var(--ink-muted)' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--primary)' : 'var(--rule)', margin: '0 4px' }} />}
          </div>
        ))}
      </div>

      {/* Server error */}
      {error && (
        <div role="alert" style={{ padding: '12px 16px', background: 'color-mix(in oklab, #ef4444 8%, var(--paper))', border: '1px solid #ef4444', marginBottom: 24, fontSize: 14, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Step 0: Account ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

            <button type="button" onClick={nextStep} style={{ marginTop: 8, padding: '13px 0', background: 'var(--ink)', color: 'var(--paper)', border: 'none', fontFamily: 'var(--ff-sans)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormField label="I am a…" error={errors.role?.message} required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {([
                  ['engineer', 'Engineer', 'ML, software, biomedical, robotics, signal processing…'],
                  ['healthcare_professional', 'Healthcare Professional', 'Clinician, doctor, nurse, researcher, health admin…'],
                ] as const).map(([value, title, desc]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value, { shouldValidate: true })}
                    style={{
                      padding: '20px 18px', border: `1.5px solid ${role === value ? 'var(--primary)' : 'var(--rule)'}`,
                      background: role === value ? 'color-mix(in oklab, var(--primary) 6%, var(--paper))' : 'var(--paper)',
                      cursor: 'pointer', textAlign: 'left', transition: 'border-color .2s, background .2s',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 500, fontSize: 18, color: role === value ? 'var(--primary)' : 'var(--ink)', marginBottom: 8 }}>{title}</div>
                    <div style={{ fontFamily: 'var(--ff-sans)', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{desc}</div>
                    <div style={{ marginTop: 14, width: 14, height: 14, border: `1.5px solid ${role === value ? 'var(--primary)' : 'var(--rule)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {role === value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
                    </div>
                  </button>
                ))}
              </div>
              {errors.role && <span role="alert" style={{ fontSize: 12, color: '#ef4444' }}>{errors.role.message}</span>}
            </FormField>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(0)} style={{ flex: 1, padding: '13px 0', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-sans)', fontSize: 15, cursor: 'pointer' }}>
                ← Back
              </button>
              <button type="button" onClick={nextStep} style={{ flex: 2, padding: '13px 0', background: 'var(--ink)', color: 'var(--paper)', border: 'none', fontFamily: 'var(--ff-sans)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Institution ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormField label="Institution" error={errors.institution?.message} required>
              <input {...inputProps('institution')} type="text" placeholder="Charité – Universitätsmedizin Berlin" />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="City" error={errors.city?.message} required>
                <input {...inputProps('city')} type="text" placeholder="Berlin" />
              </FormField>
              <FormField label="Country" error={errors.country?.message} required>
                <select {...inputProps('country')} style={{ ...inputStyle(errors.country?.message), appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M1 1l5 5 5-5' stroke='%23475569' fill='none' stroke-width='1.5' stroke-linecap='round'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                  <option value="">Select…</option>
                  {EU_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>

            {/* GDPR consent */}
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
              <input type="checkbox" required style={{ marginTop: 2, accentColor: 'var(--primary)', width: 15, height: 15, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                I have read and agree to the{' '}
                <Link to={ROUTES.PRIVACY} style={{ color: 'var(--primary)' }}>Privacy Policy</Link>.
                I understand that my data will be processed in accordance with GDPR.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '13px 0', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-sans)', fontSize: 15, cursor: 'pointer' }}>
                ← Back
              </button>
              <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '13px 0', background: isLoading ? 'var(--ink-muted)' : 'var(--accent)', color: isLoading ? 'var(--paper)' : 'var(--ink)', border: 'none', fontFamily: 'var(--ff-sans)', fontSize: 15, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {isLoading ? (
                  <><span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,.2)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />Creating account…</>
                ) : 'Create account →'}
              </button>
            </div>
          </div>
        )}
      </form>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Already have an account?</span>
        <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary)' }}>Sign in →</Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}
