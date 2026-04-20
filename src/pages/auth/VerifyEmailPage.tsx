import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'

type ChecklistItem = { label: string; done: boolean }
const CHECKLIST: ChecklistItem[] = [
  { label: 'Account created',           done: true },
  { label: 'Verification email sent',   done: true },
  { label: 'Click link in email',       done: false },
  { label: 'Sign in and get started',   done: false },
]

export default function VerifyEmailPage() {
  return (
    <PageWrapper maxWidth={520} padTop="clamp(32px, 6vw, 64px)">
      {/* Section label */}
      <div className="inline-flex items-center gap-2 bg-white border border-hai-teal/30 rounded-full px-4 py-1.5 mb-8 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
        <span className="text-hai-plum/70">03</span>
        <span>Verify Email</span>
      </div>

      {/* Mail icon on mint disc */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 bg-hai-mint rounded-3xl rotate-6" />
        <div className="absolute inset-0 bg-hai-plum rounded-3xl -rotate-3 flex items-center justify-center shadow-[0_20px_40px_-20px_rgba(54,33,62,0.45)]">
          <span
            className="material-symbols-outlined text-hai-mint text-[44px]"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            mark_email_read
          </span>
        </div>
      </div>

      {/* Headline */}
      <h1 className="font-headline font-bold text-[36px] md:text-[48px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-4">
        Check your<br />inbox<span className="text-hai-teal">.</span>
      </h1>
      <p className="text-[15px] md:text-base text-neutral-600 leading-relaxed mb-8 max-w-md">
        We've sent a verification link to your{' '}
        <span className="font-mono bg-hai-mint/60 text-hai-plum px-1.5 py-0.5 rounded font-bold">.edu</span>
        {' '}address. Click the link to activate your account before signing in.
      </p>

      {/* Checklist card */}
      <div className="bg-white rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] border border-neutral-100 overflow-hidden mb-6">
        <div className="px-6 py-4 bg-hai-offwhite border-b border-neutral-100 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">Onboarding · 4 steps</span>
          <span className="text-[10px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">
            02 / 04 complete
          </span>
        </div>
        <ul>
          {CHECKLIST.map(({ label, done }, i) => (
            <li
              key={label}
              className={`flex items-center gap-4 px-6 py-4 border-b border-neutral-100 last:border-b-0 ${done ? '' : 'bg-white'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                done ? 'bg-hai-plum text-hai-mint' : 'bg-neutral-100 border border-neutral-200 text-neutral-400'
              }`}>
                {done
                  ? <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
                  : <span className="text-[11px] font-mono font-bold">{(i + 1).toString().padStart(2, '0')}</span>}
              </div>
              <span className={`font-body text-[15px] font-semibold ${done ? 'text-hai-plum' : 'text-neutral-500'}`}>
                {label}
              </span>
              {done && (
                <span className="ml-auto text-[10px] font-mono tracking-[0.14em] uppercase text-hai-teal font-bold">
                  done
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Demo notice */}
      <div className="mb-6 p-5 bg-hai-cream/50 border border-hai-plum/10 rounded-2xl flex items-start gap-3">
        <span className="material-symbols-outlined text-hai-plum text-xl shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>info</span>
        <div>
          <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold mb-1">Demo mode</div>
          <div className="text-[13.5px] text-neutral-700 leading-relaxed font-body">
            Email verification is mocked for the demo. You can sign in directly with your new account.
          </div>
        </div>
      </div>

      {/* Continue */}
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2.5 bg-hai-plum text-white px-6 py-3.5 rounded-full font-bold text-[15px] hover:bg-black transition-colors"
        >
          Continue to sign in
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-neutral-300 bg-white text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </PageWrapper>
  )
}
