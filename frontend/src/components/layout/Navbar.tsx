import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Calendar, FileText, Menu, MessageSquare, Star, Users, X, LogOut, User, Settings, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useConversationStore } from '../../store/conversationStore'
import ThemeToggle from '../ui/ThemeToggle'
import { ROUTES } from '../../constants/routes'
import type { NotificationType, Notification } from '../../types/common.types'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')
const resolveAvatar = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`
  return url
}

function LangToggle() {
  const { i18n } = useTranslation()
  const isTR = i18n.language === 'tr'
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isTR ? 'en' : 'tr')}
      className="h-10 px-3 rounded-full border border-[#E3E7EC] bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center gap-1.5 text-xs font-black text-hai-plum"
      title={isTR ? 'Switch to English' : 'Türkçeye geç'}
    >
      <span className="text-base leading-none">{isTR ? '🇹🇷' : '🇬🇧'}</span>
      <span>{isTR ? 'TR' : 'EN'}</span>
    </button>
  )
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
    <div className="absolute right-0 top-[calc(100%+10px)] w-[340px] rounded-2xl border border-[#E3E7EC] bg-white shadow-[0_20px_60px_-20px_rgba(45,24,56,0.22)] z-[60] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E7EC]">
        <span className="text-sm font-black text-[#36213E]">{t('notif.title')}</span>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-[#1B7A88] hover:text-[#36213E] transition-colors"
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
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#F3F4F6]"
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
          className="flex items-center gap-1.5 text-sm font-bold text-[#1B7A88] hover:text-[#36213E] transition-colors"
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
  const { unreadCount: msgUnread, fetchUnreadCount } = useConversationStore()
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

  useEffect(() => {
    if (!user) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user, fetchUnreadCount])

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
              <LangToggle />
              <ThemeToggle />

              {/* Messages */}
              <Link
                to={ROUTES.MESSAGES}
                aria-label={`Messages${msgUnread > 0 ? ` (${msgUnread} unread)` : ''}`}
                className="relative w-12 h-12 rounded-full border border-[#E3E7EC] bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center justify-center text-neutral-700"
              >
                <MessageSquare size={17} />
                {msgUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-hai-plum text-hai-mint rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 border-white">
                    {msgUnread > 9 ? '9+' : msgUnread}
                  </span>
                )}
              </Link>

              {/* Notifications with hover dropdown */}
              <div
                ref={notifRef}
                className="relative"
                onMouseEnter={handleNotifEnter}
                onMouseLeave={handleNotifLeave}
              >
                <button
                  onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                  onFocus={handleNotifEnter}
                  onBlur={handleNotifLeave}
                  aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                  aria-expanded={notifOpen}
                  aria-haspopup="true"
                  className="relative w-12 h-12 rounded-full border border-[#E3E7EC] bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center justify-center text-neutral-700"
                >
                  <Bell size={17} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-hai-plum text-hai-mint rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 border-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

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
                      <div className="text-xs font-mono text-neutral-500 mt-0.5 truncate">{user.email}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-white border border-hai-teal/40 px-2 py-0.5 rounded-full text-xs font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
                        {user.role}
                      </div>
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
              <LangToggle />
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
