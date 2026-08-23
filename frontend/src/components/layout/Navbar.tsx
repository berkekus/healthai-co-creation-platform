import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Calendar, FileText, Menu, MessageSquare, Star, Users, X, LogOut, User, Settings, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import LanguageToggle from '../ui/LanguageToggle'
import { Badge, IconButton } from '../ui'
import { ROUTES } from '../../constants/routes'
import type { NotificationType, Notification } from '../../types/common.types'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')
const resolveAvatar = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`
  return url
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function NotifIcon({ type }: { type: NotificationType }) {
  const base = 'flex items-center justify-center w-9 h-9 rounded-xl shrink-0'
  switch (type) {
    case 'meeting_request':
    case 'meeting_accepted':
    case 'meeting_declined':
    case 'meeting_cancelled':
    case 'meeting_completed':
      return <span className={`${base} bg-[#E8F4F7]`}><Calendar size={15} className="text-[#8AC6D0]" /></span>
    case 'post_closed':
    case 'post_status_changed':
      return <span className={`${base} bg-[#E8F4F7]`}><FileText size={15} className="text-[#6FB8C4]" /></span>
    case 'partner_found':
      return <span className={`${base} bg-[#E8F4F7]`}><Users size={15} className="text-[#8AC6D0]" /></span>
    case 'interest_received':
      return <span className={`${base} bg-[#E8F4F7]`}><Star size={15} className="text-[#8AC6D0]" /></span>
    case 'new_message':
      return <span className={`${base} bg-[#E8F4F7]`}><MessageSquare size={15} className="text-[#8AC6D0]" /></span>
    default:
      return <span className={`${base} bg-[#EEF0F3]`}><Bell size={15} className="text-[#6F6878]" /></span>
  }
}

function NotifDropdown({
  items,
  unread,
  onMarkAllRead,
  onViewAll,
  onNavigate,
}: {
  items: Notification[]
  unread: number
  onMarkAllRead: () => void
  onViewAll: () => void
  onNavigate: (linkTo?: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[340px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#E3E7EC] bg-white shadow-[0_20px_60px_-20px_rgba(45,24,56,0.22)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E7EC]">
        <span className="text-sm font-black text-[#36213E]">{t('notif.title')}</span>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            className="cursor-pointer text-xs font-bold text-[#1B7A88] hover:text-[#36213E] transition-colors"
          >
            {t('notif.markAllRead')}
          </button>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0F3]">
            <Bell size={18} className="text-[#6F6878]" />
          </span>
          <p className="text-sm font-semibold text-[#6F6878]">{t('notif.empty')}</p>
        </div>
      ) : (
        <ul>
          {items.map(n => (
            <li key={n.id}>
              <button
                onClick={() => onNavigate(n.linkTo)}
                className="flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#F3F4F6]"
              >
                <NotifIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${n.isRead ? 'font-semibold text-[#6F6878]' : 'font-black text-[#36213E]'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#6F6878]">{n.body}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                  <span className="whitespace-nowrap text-xs font-semibold text-[#6F6878]">{timeAgo(n.createdAt)}</span>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#8AC6D0]" />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="border-t border-[#E3E7EC] px-5 py-3.5">
        <button
          onClick={onViewAll}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[#1B7A88] hover:text-[#36213E] transition-colors"
        >
          {t('notif.viewAll')}
          <span className="text-base leading-none">→</span>
        </button>
      </div>
    </div>
  )
}

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchByUser: fetchNotifs, getByUser, markAllRead } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unread = user ? unreadCount(user.id) : 0
  const recentNotifs = user ? getByUser(user.id).slice(0, 5) : []

  const handleNotifEnter = () => {
    if (notifTimer.current) clearTimeout(notifTimer.current)
    setNotifOpen(true)
    if (user) fetchNotifs()
  }

  const handleNotifLeave = () => {
    notifTimer.current = setTimeout(() => setNotifOpen(false), 150)
  }

  const closeNotif = () => {
    if (notifTimer.current) clearTimeout(notifTimer.current)
    setNotifOpen(false)
  }

  const navLinks: { to: string; label: string }[] = [
    { to: ROUTES.DASHBOARD, label: t('nav.dashboard') },
    { to: ROUTES.POSTS,     label: t('nav.browse') },
    { to: ROUTES.MEETINGS,  label: t('nav.meetings') },
  ]
  if (user?.role === 'admin') navLinks.push({ to: ROUTES.ADMIN, label: t('nav.admin') })

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
    setProfileOpen(false)
  }

  useEffect(() => {
    if (!profileOpen) return
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [profileOpen])

  // Close notification dropdown and profile menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (notifOpen) closeNotif()
      if (profileOpen) setProfileOpen(false)
      if (menuOpen) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [notifOpen, profileOpen, menuOpen])

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    const onDoc = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) closeNotif()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [notifOpen])

  const isActive = (to: string) =>
    to === ROUTES.DASHBOARD
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <header className="sticky top-0 z-50 h-[76px] bg-white/90 backdrop-blur-md border-b border-[#E3E7EC] font-body">
      <div className="max-w-[1640px] mx-auto h-full px-6 md:px-10 2xl:px-0 flex items-center justify-between gap-8">

        {/* Brand */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
          <img src="/images/healthailogo.svg" alt="HealthAI logo" className="h-8 w-auto" />
          <span className="text-lg font-black tracking-normal font-headline text-[#36213E]">
            HealthAI
          </span>
        </Link>

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
                {t('nav.home')}
              </Link>
            </div>
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {user ? (
            <>
              {/* Notifications with hover dropdown */}
              <div
                ref={notifRef}
                className="relative"
                onMouseEnter={handleNotifEnter}
                onMouseLeave={handleNotifLeave}
              >
                <IconButton
                  onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                  onFocus={handleNotifEnter}
                  onBlur={handleNotifLeave}
                  label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                  aria-expanded={notifOpen}
                  aria-haspopup="listbox"
                  size="lg"
                  icon={(
                    <>
                      <Bell size={17} />
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-hai-plum px-1 font-mono text-xs font-bold text-hai-mint">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </>
                  )}
                />

                {notifOpen && (
                  <NotifDropdown
                    items={recentNotifs}
                    unread={unread}
                    onMarkAllRead={() => markAllRead(user.id)}
                    onViewAll={() => { navigate(ROUTES.NOTIFICATIONS); setNotifOpen(false) }}
                    onNavigate={(linkTo) => {
                      if (linkTo) navigate(linkTo)
                      else navigate(ROUTES.NOTIFICATIONS)
                      setNotifOpen(false)
                    }}
                  />
                )}
              </div>

              {/* Avatar / profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  className="w-12 h-12 cursor-pointer rounded-full overflow-hidden bg-hai-mint text-hai-plum font-bold text-xs font-body flex items-center justify-center border border-hai-teal/40 hover:border-hai-plum transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-teal/70 focus-visible:ring-offset-2"
                >
                  {resolveAvatar(user.avatarUrl)
                    ? <img src={resolveAvatar(user.avatarUrl)} alt={user.name} className="w-full h-full object-cover" onError={e => { const btn = (e.currentTarget as HTMLImageElement); btn.style.display = 'none'; btn.parentElement!.insertAdjacentText('beforeend', user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()) }} />
                    : user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-[60] w-64 max-w-[calc(100vw-1rem)] bg-white rounded-2xl border border-neutral-200 shadow-[0_20px_50px_-20px_rgba(54,33,62,0.25)] overflow-hidden" role="menu">
                    <div className="px-4 py-4 bg-hai-offwhite border-b border-neutral-200">
                      <div className="font-bold text-sm text-hai-plum truncate">{user.name}</div>
                      <div className="text-xs font-mono text-neutral-500 mt-0.5 truncate">{user.email}</div>
                      <Badge variant="outline" className="mt-2 border-hai-teal/40 bg-white px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
                        {user.role}
                      </Badge>
                    </div>
                    <div className="p-2">
                      <DropItem icon={<LayoutDashboard size={15} />} label={t('nav.dashboard')}  onClick={() => { navigate(ROUTES.DASHBOARD); setProfileOpen(false) }} />
                      <DropItem icon={<User size={15} />}            label={t('nav.profile')}    onClick={() => { navigate(ROUTES.PROFILE);   setProfileOpen(false) }} />
                      {user.role === 'admin' && (
                        <DropItem icon={<Settings size={15} />} label={t('nav.adminPanel')} onClick={() => { navigate(ROUTES.ADMIN); setProfileOpen(false) }} />
                      )}
                      <div className="h-px bg-neutral-100 my-1" />
                      <DropItem icon={<LogOut size={15} />} label={t('nav.signOut')} onClick={handleLogout} danger />
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
                {t('nav.signIn')}
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center bg-hai-plum text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors"
              >
                {t('nav.signUp')}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          {user && (
            <IconButton
              onClick={() => setMenuOpen(o => !o)}
              label="Toggle menu"
              icon={menuOpen ? <X size={17} /> : <Menu size={17} />}
              className="md:hidden"
            />
          )}

          {/* Language toggle — always far right */}
          <LanguageToggle />
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && user && (
        <div className="md:hidden absolute top-[76px] inset-x-0 z-40 bg-white border-b border-neutral-200 shadow-lg py-2 font-body">
          {navLinks.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block px-6 py-3 text-base font-semibold border-l-4 ${
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
      role="menuitem"
      className={`flex cursor-pointer items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold font-body text-left transition-colors ${
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
