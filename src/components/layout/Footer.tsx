import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--rule)',
      padding: '32px 0',
      fontFamily: 'var(--ff-mono)',
      fontSize: 11,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--ink-muted)',
    }}>
      <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>HEALTH AI</span> · Co-Creation Platform · Built in Europe
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to={ROUTES.PRIVACY} style={{ color: 'var(--ink-muted)', textDecoration: 'none', transition: 'color .2s' }}>Privacy Policy</Link>
          <span>SENG 384 · Spring 2026</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  )
}
