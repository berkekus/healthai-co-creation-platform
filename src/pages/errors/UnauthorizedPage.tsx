import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'

export default function UnauthorizedPage() {
  return (
    <PageWrapper maxWidth={480}>
      <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(72px,14vw,120px)', lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--rule)', marginBottom: 24 }}>403</div>
      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 32, letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--ink)' }}>Access restricted.</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 32 }}>You don't have permission to view this page.</p>
      <Link to={ROUTES.DASHBOARD} style={{ padding: '10px 20px', background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Back to dashboard →</Link>
    </PageWrapper>
  )
}
