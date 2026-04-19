import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, X, LogOut, User, Settings } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { ROUTES } from '../../constants/routes'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const unreadCount = useNotificationStore(s => s.unreadCount)
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const unread = user ? unreadCount(user.id) : 0

  const navLinks: { to: string; label: string }[] = [
    { to: ROUTES.POSTS,    label: 'Browse Posts' },
    { to: ROUTES.MEETINGS, label: 'Meetings' },
  ]
  if (user?.role === 'admin') navLinks.push({ to: ROUTES.ADMIN, label: 'Admin' })

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
    setProfileOpen(false)
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50, height: 64,
      background: 'color-mix(in oklab, var(--paper) 88%, transparent)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--rule)',
    }}>
      <div className="wrap" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

        {/* Brand */}
        <Link to={ROUTES.HOME} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--ff-display)', fontWeight: 500, fontSize: 19, letterSpacing: '-0.01em', textDecoration: 'none', color: 'var(--ink)', flexShrink: 0 }}>
          <span style={{ width: 26, height: 26, border: '1px solid var(--ink)', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: '50%', top: 3, bottom: 3, width: 1, background: 'var(--ink)', transform: 'translateX(-50%)' }} />
            <span style={{ position: 'absolute', top: '50%', left: 3, right: 3, height: 1, background: 'var(--ink)', transform: 'translateY(-50%)' }} />
            <span style={{ position: 'absolute', left: '50%', top: '50%', width: 5, height: 5, background: 'var(--primary)', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
          </span>
          Health<em style={{ fontStyle: 'normal', color: 'var(--primary)' }}>AI</em>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {user ? navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '6px 12px', fontSize: 14, fontWeight: 500, borderRadius: 6,
              color: location.pathname.startsWith(to) ? 'var(--primary)' : 'var(--ink-muted)',
              background: location.pathname.startsWith(to) ? 'color-mix(in oklab, var(--primary) 10%, transparent)' : 'transparent',
              textDecoration: 'none', transition: 'color .2s, background .2s',
            }}>
              {label}
            </Link>
          )) : (
            [{ href: '#features', label: 'Features' }, { href: '#coverage', label: 'Coverage' }, { href: '#about', label: 'About' }].map(({ href, label }) => (
              <a key={href} href={href} style={{
                padding: '6px 12px', fontSize: 14, fontWeight: 500, borderRadius: 6,
                color: 'var(--ink-muted)', textDecoration: 'none', transition: 'color .2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
              >
                {label}
              </a>
            ))
          )}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {user ? (
            <>
              {/* Notification bell */}
              <Link to={ROUTES.NOTIFICATIONS} style={{ position: 'relative', padding: 8, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center' }}>
                <Bell size={18} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'var(--ff-mono)', color: 'var(--paper)', fontWeight: 600 }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* Profile avatar */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--rule)', background: 'color-mix(in oklab, var(--primary) 12%, var(--paper))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'var(--ff-sans)', fontWeight: 600, fontSize: 12, color: 'var(--primary)' }}
                >
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </button>
                {profileOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 42, width: 220, background: 'var(--paper)', border: '1px solid var(--rule)', boxShadow: '0 8px 24px -8px color-mix(in oklab, var(--ink) 20%, transparent)', zIndex: 60 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{user.email}</div>
                    </div>
                    <div style={{ padding: 4 }}>
                      <DropItem icon={<User size={14} />} label="Profile" onClick={() => { navigate(ROUTES.PROFILE); setProfileOpen(false) }} />
                      {user.role === 'admin' && <DropItem icon={<Settings size={14} />} label="Admin Panel" onClick={() => { navigate(ROUTES.ADMIN); setProfileOpen(false) }} />}
                      <DropItem icon={<LogOut size={14} />} label="Sign out" onClick={handleLogout} danger />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} style={{ padding: '7px 14px', fontSize: 14, color: 'var(--ink)', border: '1px solid var(--rule)', textDecoration: 'none', transition: 'border-color .2s' }}>Sign in</Link>
              <Link to={ROUTES.REGISTER} style={{ padding: '7px 14px', fontSize: 14, background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)', textDecoration: 'none', fontWeight: 500 }}>Request access</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'none', padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }} className="mobile-menu-btn">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && user && (
        <div style={{ position: 'absolute', top: 64, left: 0, right: 0, background: 'var(--paper)', borderBottom: '1px solid var(--rule)', padding: '12px 0' }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 24px', fontSize: 15, color: 'var(--ink)', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

function DropItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px',
      background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--ff-sans)',
      color: danger ? '#ef4444' : 'var(--ink)', textAlign: 'left',
      borderRadius: 4, transition: 'background .15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f1f5f9)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {icon}{label}
    </button>
  )
}
