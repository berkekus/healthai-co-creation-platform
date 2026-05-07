import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, MessageSquare, X, LogOut, User, Settings, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useConversationStore } from '../../store/conversationStore'
import { ROUTES } from '../../constants/routes'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')
const resolveAvatar = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`
  return url
}

/**
 * Authenticated-app Navbar (Faz 1 refresh).
 * Visual language matches the landing page: hai-* palette, Plus Jakarta Sans
 * (display / caps pills) + Source Sans 3 (body), "healthai." logo mark,
 * pill-style active link state, round Request Access / Sign in buttons.
 */
export default function Navbar() {
  const { user, logout } = useAuthStore()
  const unreadCount = useNotificationStore(s => s.unreadCount)
  const { unreadCount: msgUnread, fetchUnreadCount } = useConversationStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const unread = user ? unreadCount(user.id) : 0

  useEffect(() => {
    if (!user) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user, fetchUnreadCount])

  const navLinks: { to: string; label: string }[] = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard' },
    { to: ROUTES.POSTS,     label: 'Browse Posts' },
    { to: ROUTES.MEETINGS,  label: 'Meetings' },
  ]
  if (user?.role === 'admin') navLinks.push({ to: ROUTES.ADMIN, label: 'Admin' })

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
    setProfileOpen(false)
  }

  // close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [profileOpen])

  const isActive = (to: string) =>
    to === ROUTES.DASHBOARD
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <header className="sticky top-0 z-50 h-[76px] bg-white/90 backdrop-blur-md border-b border-[#e8e8ee] font-body">
      <div className="max-w-[1640px] mx-auto h-full px-6 md:px-10 2xl:px-0 flex items-center justify-between gap-8">

        {/* Brand */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
          <img src="/images/healthailogo.svg" alt="HealthAI logo" className="h-8 w-auto" />
          <span className="text-[18px] font-extrabold tracking-tight font-headline text-[#111111]">
            HealthAI
          </span>
        </Link>

        {/* Center nav — premium micro-interaction:
            generous px-4 py-2 tap target, soft rounded-lg corners, and a
            barely-there black/5 wash that fades in over 200 ms. Text color
            only shifts by a hair (neutral-600 → neutral-900) so it stays in
            harmony with the background tint instead of fighting it. */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-3">
          {user ? navLinks.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-200 ease-in-out ${
                  active
                    ? 'bg-hai-mint/55 text-hai-plum'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
                }`}
              >
                {label}
              </Link>
            )
          }) : (
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className="px-5 py-2.5 rounded-full text-sm font-bold text-neutral-600 hover:text-neutral-900 hover:bg-black/5 transition-colors duration-200 ease-in-out"
              >
                Home
              </Link>
            </div>
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {user ? (
            <>
              {/* Messages */}
              <Link
                to={ROUTES.MESSAGES}
                aria-label={`Messages${msgUnread > 0 ? ` (${msgUnread} unread)` : ''}`}
                className="relative w-12 h-12 rounded-full border border-[#e8e8ee] bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center justify-center text-neutral-700"
              >
                <MessageSquare size={17} />
                {msgUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-hai-plum text-hai-mint rounded-full flex items-center justify-center text-[10px] font-mono font-bold border-2 border-white">
                    {msgUnread > 9 ? '9+' : msgUnread}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link
                to={ROUTES.NOTIFICATIONS}
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                className="relative w-12 h-12 rounded-full border border-[#e8e8ee] bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center justify-center text-neutral-700"
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-hai-plum text-hai-mint rounded-full flex items-center justify-center text-[10px] font-mono font-bold border-2 border-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* Avatar / profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  aria-label="Account menu"
                  className="w-12 h-12 rounded-full overflow-hidden bg-hai-mint text-hai-plum font-bold text-xs font-body flex items-center justify-center border border-hai-teal/40 hover:border-hai-plum transition-colors"
                >
                  {resolveAvatar(user.avatarUrl)
                    ? <img src={resolveAvatar(user.avatarUrl)} alt={user.name} className="w-full h-full object-cover" onError={e => { const btn = (e.currentTarget as HTMLImageElement); btn.style.display = 'none'; btn.parentElement!.insertAdjacentText('beforeend', user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()) }} />
                    : user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl border border-neutral-200 shadow-[0_20px_50px_-20px_rgba(54,33,62,0.25)] overflow-hidden z-[60]">
                    <div className="px-4 py-4 bg-hai-offwhite border-b border-neutral-200">
                      <div className="font-bold text-sm text-hai-plum truncate">{user.name}</div>
                      <div className="text-[11px] font-mono text-neutral-500 mt-0.5 truncate">{user.email}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-white border border-hai-teal/40 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
                        {user.role}
                      </div>
                    </div>
                    <div className="p-2">
                      <DropItem icon={<LayoutDashboard size={15} />} label="Dashboard" onClick={() => { navigate(ROUTES.DASHBOARD); setProfileOpen(false) }} />
                      <DropItem icon={<User size={15} />}            label="Profile"   onClick={() => { navigate(ROUTES.PROFILE);   setProfileOpen(false) }} />
                      {user.role === 'admin' && (
                        <DropItem icon={<Settings size={15} />} label="Admin Panel" onClick={() => { navigate(ROUTES.ADMIN); setProfileOpen(false) }} />
                      )}
                      <div className="h-px bg-neutral-100 my-1" />
                      <DropItem icon={<LogOut size={15} />} label="Sign out" onClick={handleLogout} danger />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-bold text-neutral-800 border border-neutral-300 hover:bg-neutral-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center bg-hai-plum text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors"
              >
                Request Access
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              className="md:hidden w-10 h-10 rounded-full border border-neutral-200 bg-white text-neutral-700 flex items-center justify-center"
            >
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && user && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-neutral-200 shadow-lg py-2 font-body">
          {navLinks.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block px-6 py-3 text-[15px] font-semibold border-l-4 ${
                  active
                    ? 'border-hai-plum bg-hai-mint/40 text-hai-plum'
                    : 'border-transparent text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}

function DropItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold font-body text-left transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-neutral-800 hover:bg-hai-mint/40 hover:text-hai-plum'
      }`}
    >
      <span className={danger ? 'text-red-500' : 'text-neutral-500'}>{icon}</span>
      {label}
    </button>
  )
}
