import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'

export default function VerifyEmailPage() {
  return (
    <PageWrapper maxWidth={480} padTop="clamp(48px,8vw,96px)">
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', gap: 16 }}>
        <span style={{ color: 'var(--primary)' }}>03</span>
        <span>Verify Email</span>
      </div>

      {/* Large icon — typographic */}
      <div style={{ fontFamily: 'var(--ff-display)', fontSize: 72, lineHeight: 1, color: 'var(--rule)', marginBottom: 32, userSelect: 'none' }}>✉</div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.025em', margin: '0 0 16px', color: 'var(--ink)' }}>
        Check your inbox.
      </h1>
      <p style={{ color: 'var(--ink-muted)', lineHeight: 1.65, fontSize: 15.5, margin: '0 0 32px' }}>
        We've sent a verification link to your <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>.edu</span> address. Click the link to activate your account before signing in.
      </p>

      {/* Mock step checklist */}
      <div style={{ border: '1px solid var(--rule)', marginBottom: 32 }}>
        {[
          ['✓', 'Account created',           true],
          ['✓', 'Verification email sent',    true],
          ['○', 'Click link in email',        false],
          ['○', 'Sign in and get started',    false],
        ].map(([icon, label, done]) => (
          <div key={String(label)} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 12, letterSpacing: '.06em', color: done ? 'var(--ink)' : 'var(--ink-muted)' }}>
            <span style={{ color: done ? 'var(--primary)' : 'var(--rule)', fontWeight: 600, width: 14, textAlign: 'center' }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>

      {/* Demo note */}
      <div style={{ padding: '14px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', lineHeight: 1.8, marginBottom: 32 }}>
        <div style={{ color: 'var(--primary)', fontWeight: 500, marginBottom: 6, letterSpacing: '.14em', textTransform: 'uppercase' }}>Demo mode</div>
        Email verification is mocked. You can sign in directly with your new account.
      </div>

      <Link to={ROUTES.LOGIN} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none', fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500 }}>
        Continue to sign in →
      </Link>
    </PageWrapper>
  )
}
