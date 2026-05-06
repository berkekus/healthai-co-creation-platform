import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Check, FileText, Filter, Shield, Star, Users } from 'lucide-react'
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
  if (type === 'meeting_request' || type === 'meeting_completed') return { Icon: Calendar, bg: '#e8f5e9', color: '#4caf50' }
  if (type === 'meeting_accepted')  return { Icon: Calendar, bg: '#e3f2fd', color: '#2196f3' }
  if (type === 'meeting_declined' || type === 'meeting_cancelled') return { Icon: Calendar, bg: '#fce4ec', color: '#e91e63' }
  if (type === 'partner_found')     return { Icon: Users, bg: '#e8f5e9', color: '#43a047' }
  if (type === 'interest_received') return { Icon: Star, bg: '#fff8e1', color: '#f59e0b' }
  if (type === 'post_closed' || type === 'post_status_changed') return { Icon: FileText, bg: '#e3f2fd', color: '#2196f3' }
  if (type === 'account_activity')  return { Icon: Shield, bg: '#ede7f6', color: '#5c6bc0' }
  return { Icon: Bell, bg: '#f3e5f5', color: '#9c27b0' }
}

export default function NotificationsPage() {
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
    { key: 'all',      label: 'All Notifications', icon: <Bell size={16} strokeWidth={1.8} /> },
    { key: 'unread',   label: 'Unread',             icon: <UnreadDotIcon /> },
    { key: 'meetings', label: 'Meetings',            icon: <Calendar size={16} strokeWidth={1.8} /> },
    { key: 'posts',    label: 'Posts',               icon: <FileText size={16} strokeWidth={1.8} /> },
    { key: 'system',   label: 'System',              icon: <Shield size={16} strokeWidth={1.8} /> },
  ]

  const activeLabel = tabs.find(t => t.key === activeTab)?.label ?? 'All Notifications'

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-body">
      <div className="max-w-[1320px] mx-auto px-6 pt-8 pb-20 flex gap-5 items-start">

        {/* ── SIDEBAR ── */}
        <aside className="w-[256px] shrink-0 bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[#eaecf0]">
            <div className="flex items-center gap-2.5 text-[15px] font-black text-[#18203a]">
              <Bell size={17} strokeWidth={2} />
              Notifications
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
                    active
                      ? 'bg-[#eef3ff] text-[#3b6ef0]'
                      : 'text-[#6b7280] hover:bg-[#f4f5f7] hover:text-[#18203a]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-[#3b6ef0]' : 'text-[#9ca3af]'}>{t.icon}</span>
                    {t.label}
                  </div>
                  {count > 0 && (
                    <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${
                      active ? 'bg-[#3b6ef0]/10 text-[#3b6ef0]' : 'bg-[#f0f1f3] text-[#9ca3af]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Stay in the loop */}
          <div className="mx-3 mb-4 p-4 bg-[#f4f4ff] rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#e0e0f8] flex items-center justify-center mx-auto mb-3">
              <Bell size={20} strokeWidth={1.8} className="text-[#7c6fcd]" />
            </div>
            <div className="text-[13px] font-black text-[#18203a] mb-1">Stay in the loop</div>
            <p className="text-[12px] text-[#7a7a9a] leading-relaxed mb-3">
              Enable browser notifications to never miss important updates.
            </p>
            <button
              onClick={() => Notification.requestPermission()}
              className="w-full py-2 rounded-full border border-[#7c6fcd] text-[#7c6fcd] text-[12px] font-bold hover:bg-[#7c6fcd] hover:text-white transition-colors"
            >
              Enable Notifications
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-6 pb-5 border-b border-[#eaecf0] flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[21px] font-black text-[#18203a]">{activeLabel}</h1>
              <p className="text-[13px] text-[#9ca3af] mt-0.5">
                {filtered.length === 0
                  ? "You're all caught up! No new notifications."
                  : `${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {counts.unread > 0 && (
                <button
                  onClick={() => user && markAllRead(user.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#eaecf0] text-[13px] font-bold text-[#18203a] hover:border-[#3b6ef0] hover:text-[#3b6ef0] transition-colors"
                >
                  <Check size={14} strokeWidth={2.5} />
                  Mark all as read
                </button>
              )}
              <button className="w-10 h-10 rounded-xl border border-[#eaecf0] flex items-center justify-center text-[#9ca3af] hover:border-[#3b6ef0] hover:text-[#3b6ef0] transition-colors">
                <Filter size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Notification rows */}
          <div className="divide-y divide-[#f3f4f6]">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f0f1f3] flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-[#c8ccd4]" />
                </div>
                <p className="text-[14px] font-semibold text-[#9ca3af]">No notifications here</p>
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
                    } ${n.isRead ? 'hover:bg-[#fafafa]' : 'bg-[#f8fbff] hover:bg-[#eef4ff]'}`}
                  >
                    {/* Icon with unread indicator */}
                    <div className="relative shrink-0 mt-0.5">
                      {!n.isRead && (
                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#3b6ef0]" />
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
                      <div className={`text-[14.5px] leading-snug ${
                        n.isRead ? 'text-[#374151] font-semibold' : 'text-[#18203a] font-bold'
                      }`}>
                        {n.title}
                      </div>
                      <div className="text-[13px] text-[#9ca3af] mt-0.5 truncate">{n.body}</div>
                    </div>

                    {/* Time + dot */}
                    <div className="flex items-center gap-2.5 shrink-0 mt-1">
                      <span className="text-[12.5px] text-[#b0b7c3] font-medium whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#3b6ef0] shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div className="py-5 text-center text-[12.5px] text-[#b0b7c3] font-medium border-t border-[#f3f4f6]">
              No more notifications
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
