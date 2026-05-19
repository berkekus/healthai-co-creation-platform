import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Check, FileText, Filter, Shield, Star, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import type { Notification, NotificationType } from '../../types/common.types'

type FilterTab = 'all' | 'unread' | 'meetings' | 'posts' | 'system'

const MEETING_TYPES: NotificationType[] = [
  'meeting_request', 'meeting_accepted', 'meeting_declined', 'meeting_cancelled', 'meeting_completed',
]
const POST_TYPES: NotificationType[] = [
  'post_closed', 'post_status_changed', 'partner_found', 'interest_received',
]
const SYSTEM_TYPES: NotificationType[] = ['account_activity']

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
}

function getIconStyle(type: NotificationType): { Icon: typeof Bell; bg: string; color: string } {
  if (type === 'meeting_declined' || type === 'meeting_cancelled') return { Icon: Calendar, bg: '#F7EDEE', color: '#B64B55' }
  if (type === 'meeting_request' || type === 'meeting_accepted' || type === 'meeting_completed') return { Icon: Calendar, bg: '#E8F4F7', color: '#6FB8C4' }
  if (type === 'partner_found') return { Icon: Users, bg: '#E8F4F7', color: '#6FB8C4' }
  if (type === 'interest_received') return { Icon: Star, bg: '#E3DCD2', color: '#36213E' }
  if (type === 'post_closed' || type === 'post_status_changed') return { Icon: FileText, bg: '#E8F4F7', color: '#6FB8C4' }
  if (type === 'account_activity') return { Icon: Shield, bg: '#EEF0F3', color: '#36213E' }
  return { Icon: Bell, bg: '#EEF0F3', color: '#6F6878' }
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { getByUser, fetchByUser, markRead, markAllRead } = useNotificationStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    if (user) fetchByUser(user.id)
  }, [user?.id, fetchByUser])

  const all = user ? getByUser(user.id) : []

  const filtered =
    activeTab === 'all'      ? all :
    activeTab === 'unread'   ? all.filter(n => !n.isRead) :
    activeTab === 'meetings' ? all.filter(n => MEETING_TYPES.includes(n.type)) :
    activeTab === 'posts'    ? all.filter(n => POST_TYPES.includes(n.type)) :
    all.filter(n => SYSTEM_TYPES.includes(n.type))

  const counts: Record<FilterTab, number> = {
    all:      all.length,
    unread:   all.filter(n => !n.isRead).length,
    meetings: all.filter(n => MEETING_TYPES.includes(n.type)).length,
    posts:    all.filter(n => POST_TYPES.includes(n.type)).length,
    system:   all.filter(n => SYSTEM_TYPES.includes(n.type)).length,
  }

  const handleClick = (n: Notification) => {
    markRead(n.id)
    if (n.linkTo) navigate(n.linkTo)
  }

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all',      label: t('notificationsPage.tabs.all'),      icon: <Bell size={16} strokeWidth={1.8} /> },
    { key: 'unread',   label: t('notificationsPage.tabs.unread'),   icon: <UnreadDotIcon /> },
    { key: 'meetings', label: t('notificationsPage.tabs.meetings'), icon: <Calendar size={16} strokeWidth={1.8} /> },
    { key: 'posts',    label: t('notificationsPage.tabs.posts'),    icon: <FileText size={16} strokeWidth={1.8} /> },
    { key: 'system',   label: t('notificationsPage.tabs.system'),   icon: <Shield size={16} strokeWidth={1.8} /> },
  ]

  const activeLabel = tabs.find(tb => tb.key === activeTab)?.label ?? t('notificationsPage.tabs.all')

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-body">
      <div className="max-w-[1320px] mx-auto px-6 pt-8 pb-20 flex gap-5 items-start">

        {/* ── SIDEBAR ── */}
        <aside className="w-[256px] shrink-0 bg-white rounded-2xl border border-[#E3E7EC] overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[#E3E7EC]">
            <div className="flex items-center gap-2.5 text-base font-black text-[#36213E]">
              <Bell size={17} strokeWidth={2} />
              {t('notificationsPage.title')}
            </div>
          </div>

          <nav className="p-2 pb-3">
            {tabs.map(t => {
              const active = activeTab === t.key
              const count  = counts[t.key]
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  disabled={count === 0 && t.key !== 'all'}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#E8F4F7] text-[#1B7A88]'
                      : count === 0 && t.key !== 'all'
                        ? 'text-[#C5CAD6] cursor-not-allowed'
                        : 'text-[#6F6878] hover:bg-[#EEF0F3] hover:text-[#36213E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-[#1B7A88]' : count === 0 && t.key !== 'all' ? 'text-[#C5CAD6]' : 'text-[#6F6878]'}>
                      {t.icon}
                    </span>
                    {t.label}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    active ? 'bg-[#1B7A88]/10 text-[#1B7A88]'
                    : count === 0 ? 'text-[#C5CAD6]'
                    : 'bg-[#EEF0F3] text-[#6F6878]'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Stay in the loop */}
          <div className="mx-3 mb-4 p-4 bg-[#E8F4F7] rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#D7EEF2] flex items-center justify-center mx-auto mb-3">
              <Bell size={20} strokeWidth={1.8} className="text-[#8AC6D0]" />
            </div>
            <div className="text-sm font-black text-[#36213E] mb-1">{t('notificationsPage.stayInLoop')}</div>
            <p className="text-xs text-[#6F6878] leading-relaxed mb-3">{t('notificationsPage.enableDesc')}</p>
            <button
              onClick={() => Notification.requestPermission()}
              className="w-full py-2 rounded-full border border-[#1B7A88] text-[#1B7A88] text-xs font-bold hover:bg-[#36213E] hover:border-[#36213E] hover:text-white transition-colors"
            >
              {t('notificationsPage.enableBtn')}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 bg-white rounded-2xl border border-[#E3E7EC] overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-6 pb-5 border-b border-[#E3E7EC] flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-[#36213E]">{activeLabel}</h1>
              <p className="text-sm text-[#6F6878] mt-0.5">
                {filtered.length === 0
                  ? t('notificationsPage.allCaughtUp')
                  : t('notificationsPage.count', { count: filtered.length })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {counts.unread > 0 && (
                <button
                  onClick={() => user && markAllRead(user.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E3E7EC] text-sm font-bold text-[#36213E] hover:border-[#8AC6D0] hover:text-[#8AC6D0] transition-colors"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {t('notificationsPage.markAllRead')}
                </button>
              )}
              <button className="w-10 h-10 rounded-xl border border-[#E3E7EC] flex items-center justify-center text-[#6F6878] hover:border-[#8AC6D0] hover:text-[#8AC6D0] transition-colors">
                <Filter size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Notification rows */}
          <div className="divide-y divide-[#F3F4F6]">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#EEF0F3] flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-[#D5DAE0]" />
                </div>
                <p className="text-sm font-semibold text-[#6F6878]">{t('notificationsPage.none')}</p>
              </div>
            ) : (
              filtered.map(n => {
                const { Icon, bg, color } = getIconStyle(n.type)
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-4 px-7 py-4 transition-colors ${
                      n.linkTo ? 'cursor-pointer' : ''
                    } ${n.isRead ? 'hover:bg-[#F3F4F6]' : 'bg-[#F3F4F6] hover:bg-[#E8F4F7]'}`}
                  >
                    {/* Icon with unread indicator */}
                    <div className="relative shrink-0 mt-0.5">
                      {!n.isRead && (
                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#8AC6D0]" />
                      )}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon size={20} strokeWidth={1.8} style={{ color }} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm leading-snug ${
                        n.isRead ? 'text-[#36213E] font-semibold' : 'text-[#36213E] font-bold'
                      }`}>
                        {n.title}
                      </div>
                      <div className="text-sm text-[#6F6878] mt-0.5 truncate">{n.body}</div>
                    </div>

                    {/* Time + dot */}
                    <div className="flex items-center gap-2.5 shrink-0 mt-1">
                      <span className="text-xs text-[#6F6878] font-semibold whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#8AC6D0] shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div className="py-5 text-center text-xs text-[#6F6878] font-semibold border-t border-[#F3F4F6]">
              {t('notificationsPage.noMore')}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function UnreadDotIcon() {
  return (
    <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-current" />
    </div>
  )
}
