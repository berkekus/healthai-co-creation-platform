import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart2, Calendar, CheckCircle, ChevronRight, Clock,
  Download, FileText, Headphones, LayoutDashboard, Plus,
  Settings, Shield, Trash2, UserCheck, UserMinus, UserPlus,
  Users, X, Search, ChevronDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { uiLocale } from '../../utils/formatDate'
import type { TFunction } from 'i18next'
import { usePostStore } from '../../store/postStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useMeetingStore } from '../../store/meetingStore'
import api from '../../lib/api'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { usePostList } from '../../hooks/usePostList'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { fetchAdminUsers, fetchLogs } from '../../lib/adminApi'
import { queryClient } from '../../lib/queryClient'
import { LOG_ACTIONS, CRITICAL_LOG_ACTIONS } from '../../constants/logActions'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import type { ActivityLog } from '../../types/common.types'
import type { User } from '../../types/auth.types'
import { ROUTES } from '../../constants/routes'

type AdminView = 'overview' | 'users' | 'posts' | 'logs' | 'verification'
const USERS_PAGE_SIZES = [20, 50, 100] as const
const USERS_PAGE_SIZE_KEY = 'admin_usersPerPage'
const POSTS_PAGE_SIZE = 20
const LOGS_PAGE_SIZE = 50

function readUsersPageSize(): number {
  try {
    const saved = Number(localStorage.getItem(USERS_PAGE_SIZE_KEY))
    return (USERS_PAGE_SIZES as readonly number[]).includes(saved) ? saved : USERS_PAGE_SIZES[0]
  } catch {
    return USERS_PAGE_SIZES[0]
  }
}

function roleLabel(t: TFunction, role: string) {
  return t(`common.role.${role}`, { defaultValue: role })
}

function downloadUsersCSV(users: User[]) {
  const headers = ['name', 'email', 'role', 'institution', 'city', 'country', 'isVerified', 'isSuspended', 'createdAt']
  const rows = users
    .filter(u => u.role !== 'admin')
    .map(u => headers.map(h => `"${String((u as unknown as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(','))
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })),
    download: `healthai-users-${new Date().toISOString().split('T')[0]}.csv`,
  })
  a.click()
}

function downloadCSV(logs: ActivityLog[]) {
  const headers = ['timestamp', 'userId', 'userEmail', 'role', 'action', 'targetEntityId', 'result', 'ipAddress']
  const rows = logs.map(l =>
    headers.map(h => `"${String((l as unknown as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(','),
  )
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })),
    download: `healthai-logs-${new Date().toISOString().split('T')[0]}.csv`,
  })
  a.click()
}

function timeAgo(iso: string, t: TFunction) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return t('common.justNow')
  if (m < 60) return t('common.minutesAgo', { count: m })
  const h = Math.floor(m / 60)
  if (h < 24) return t('common.hoursAgo', { count: h })
  return t('common.daysAgo', { count: Math.floor(h / 24) })
}

// ── SIDEBAR ───────────────────────────────────────────────
// Always expanded on lg+. Between md and lg it collapses to icons and expands on
// hover or keyboard focus, so labels never depend on a mouse.
function AdminSidebar({ view, onNavigate }: { view: AdminView; onNavigate: (v: AdminView) => void }) {
  const { t } = useTranslation()
  const mainViews = new Set<AdminView>(['overview', 'users', 'posts', 'logs', 'verification'])

  const navItems: { id: string; label: string; icon: React.ReactNode; route?: string; soon?: true }[] = [
    { id: 'overview',     label: t('admin.tabs.overview'),     icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
    { id: 'users',        label: t('admin.tabs.users'),        icon: <Users size={18} strokeWidth={1.8} /> },
    { id: 'verification', label: t('admin.tabs.verification'), icon: <UserCheck size={18} strokeWidth={1.8} /> },
    { id: 'posts',        label: t('admin.tabs.posts'),        icon: <FileText size={18} strokeWidth={1.8} /> },
    { id: 'logs',         label: t('admin.tabs.logs'),         icon: <Clock size={18} strokeWidth={1.8} /> },
    { id: 'meetings',     label: t('admin.tabs.meetings'),     icon: <Calendar size={18} strokeWidth={1.8} />, route: ROUTES.MEETINGS },
    { id: 'security',     label: t('admin.sidebar.security'),  icon: <Shield size={18} strokeWidth={1.8} />, soon: true },
    { id: 'reports',      label: t('admin.sidebar.reports'),   icon: <BarChart2 size={18} strokeWidth={1.8} />, soon: true },
    { id: 'settings',     label: t('admin.sidebar.settings'),  icon: <Settings size={18} strokeWidth={1.8} />, soon: true },
  ]

  return (
    <aside className="group/sb flex flex-col bg-white border-r border-line shrink-0 overflow-x-hidden w-[56px] hover:w-[220px] focus-within:w-[220px] lg:w-[220px] transition-all duration-200">
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto overflow-x-hidden">
        {navItems.map(item => {
          const isActive = item.id === view
          const isDisabled = !mainViews.has(item.id as AdminView) && !item.route

          if (item.route) {
            return (
              <Link key={item.id} to={item.route}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-ink-muted hover:bg-[#f5f5ff] hover:text-admin-accent transition-colors">
                <span className="shrink-0">{item.icon}</span>
                <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100 lg:opacity-100 transition-opacity duration-150 delay-75">{item.label}</span>
              </Link>
            )
          }

          return (
            <button key={item.id}
              onClick={() => !isDisabled && mainViews.has(item.id as AdminView) && onNavigate(item.id as AdminView)}
              disabled={isDisabled}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors w-full text-left ${
                isActive     ? 'bg-[#eeecff] text-admin-accent'
                : isDisabled ? 'text-ink-faint cursor-default'
                : 'text-ink-muted hover:bg-[#f5f5ff] hover:text-admin-accent'
              }`}>
              <span className="shrink-0">{item.icon}</span>
              <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100 lg:opacity-100 transition-opacity duration-150 delay-75 flex-1">{item.label}</span>
              {item.soon && (
                <span className="text-xs font-black uppercase tracking-[0.12em] whitespace-nowrap opacity-0 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100 lg:opacity-100 transition-opacity duration-150 delay-75 bg-[#f0f0ff] text-[#a8a4d4] rounded-full px-2 py-0.5">
                  {t('admin.sidebar.soon')}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Need help */}
      <div className="m-2 p-3 bg-[#f8f8ff] rounded-xl border border-[#eeeeff] overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Headphones size={16} strokeWidth={1.8} className="text-admin-accent shrink-0" />
          <span className="text-xs font-black text-ink whitespace-nowrap opacity-0 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100 lg:opacity-100 transition-opacity duration-150 delay-75">{t('admin.sidebar.needHelp')}</span>
        </div>
        <svg viewBox="0 0 80 24" className="w-full opacity-40 mb-2">
          <path d="M0,18 C10,14 15,20 25,12 C35,4 40,16 50,10 C60,4 70,14 80,8"
            fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="w-[180px] text-xs text-ink-muted leading-relaxed opacity-0 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100 lg:opacity-100 transition-opacity duration-150 delay-75 mb-2">
          {t('admin.sidebar.supportBlurb')}
        </p>
        <a
          href="mailto:support@healthai.edu"
          className="flex items-center gap-1 text-xs font-bold text-admin-accent whitespace-nowrap opacity-0 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100 lg:opacity-100 transition-opacity duration-150 delay-75 hover:underline"
        >
          {t('admin.sidebar.contactSupport')} <ChevronRight size={12} />
        </a>
      </div>
    </aside>
  )
}

// ── STAT CARD ─────────────────────────────────────────────
function StatCard({ label, value, icon, iconBg, iconColor, change, up, vsLast7 }: {
  label: string; value: number; icon: React.ReactNode
  iconBg: string; iconColor: string; change: string; up: boolean | null; vsLast7: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-line p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <div className="text-4xl font-black text-ink leading-none">{value}</div>
      </div>
      <div className="text-sm text-ink-muted font-semibold mb-1.5">{label}</div>
      <div className={`text-xs font-semibold ${up === true ? 'text-success-dot' : up === false ? 'text-danger-dot' : 'text-ink-muted'}`}>
        {up === true ? '↑' : up === false ? '↓' : '—'} {change}
        <span className="text-ink-muted font-normal ml-1">{vsLast7}</span>
      </div>
    </div>
  )
}

// ── USER GROWTH CHART ─────────────────────────────────────
function UserGrowthChart({ users, days, growth }: { users: User[]; days: number; growth?: PlatformStats['userGrowth'] }) {
  const today = new Date()
  // Same YYYY-MM-DD keys the server grouped by, in the same time zone.
  const dayKey = growth
    ? new Intl.DateTimeFormat('en-CA', { timeZone: growth.timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
    : null
  const pts = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    const label = d.toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short' })
    if (growth && dayKey) {
      const key = dayKey.format(d)
      const total = growth.totalBefore + growth.daily.reduce((sum, day) => (day.date <= key ? sum + day.count : sum), 0)
      return { label, total }
    }
    // Fallback while stats are unavailable: only as complete as the users list (at most 500).
    const total = users.filter(u => u.createdAt && new Date(u.createdAt) <= d).length
    return { label, total }
  })

  const W = 560, H = 120, pL = 36, pR = 12, pT = 10, pB = 26
  const plotW = W - pL - pR, plotH = H - pT - pB
  const maxVal = Math.max(...pts.map(d => d.total), 1)
  const svgPts = pts.map((d, i) => ({
    x: pL + (i / (days - 1)) * plotW,
    y: pT + plotH - (d.total / maxVal) * plotH,
    ...d,
  }))

  const smoothPath = (points: typeof svgPts) => {
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1], c = points[i]
      const cpx = (p.x + c.x) / 2
      d += ` C${cpx.toFixed(1)},${p.y.toFixed(1)} ${cpx.toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`
    }
    return d
  }

  const linePath = smoothPath(svgPts)
  const last = svgPts[svgPts.length - 1]
  const first = svgPts[0]
  const areaPath = `${linePath} L${last.x},${pT + plotH} L${first.x},${pT + plotH}Z`
  const yTicks = [0, Math.round(maxVal * 0.5), maxVal]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => {
        const y = pT + plotH - (v / maxVal) * plotH
        return (
          <g key={i}>
            <line x1={pL} y1={y} x2={pL + plotW} y2={y} stroke="#f0f1f3" strokeWidth="1" />
            <text x={pL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#b0b7c3">{v}</text>
          </g>
        )
      })}
      <path d={areaPath} fill="url(#ag)" />
      <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      {svgPts.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={H - 2} textAnchor="middle" fontSize="9" fill="#b0b7c3">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ── MINI SPARKLINE ────────────────────────────────────────
function MiniSparkline() {
  return (
    <svg viewBox="0 0 80 28" className="w-20 h-7">
      <path d="M0,22 C8,18 12,24 20,16 C28,8 35,20 44,14 C53,8 60,18 70,12 C74,10 77,14 80,10"
        fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ── OVERVIEW ──────────────────────────────────────────────
function VerificationQueueTab() {
  const { t } = useTranslation()
  const [pending, setPending] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get<{ success: boolean; data: { users: (User & { _id?: string })[] } }>('/auth/users', { params: { isVerified: 'false', limit: 200 } })
      .then(({ data }) => setPending(data.data.users.map(u => ({ ...u, id: u._id ?? u.id })).filter(u => u.role !== 'admin')))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleVerify = async (userId: string) => {
    await api.patch(`/auth/users/${userId}/verify`)
    setPending(prev => prev.filter(u => u.id !== userId))
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-black text-ink">{t('admin.verification.title')}</h1>
        <p className="text-sm text-ink-muted mt-0.5">{loading ? '…' : pending.length} {t('admin.verification.pending')}</p>
      </div>
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-ink-muted">{t('admin.verification.loading')}</div>
        ) : pending.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle size={32} className="mx-auto text-success-dot mb-3" />
            <p className="text-sm font-semibold text-ink-gray">{t('admin.verification.noPending')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hai-offwhite bg-surface-subtle">
                <th className="px-6 py-3 text-left text-xs font-black text-ink-muted uppercase tracking-wide">{t('admin.verification.columns.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-black text-ink-muted uppercase tracking-wide">{t('admin.verification.columns.role')}</th>
                <th className="px-6 py-3 text-left text-xs font-black text-ink-muted uppercase tracking-wide">{t('admin.verification.columns.institution')}</th>
                <th className="px-6 py-3 text-left text-xs font-black text-ink-muted uppercase tracking-wide">{t('admin.verification.columns.registered')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {pending.map(u => (
                <tr key={u.id} className="border-b border-hai-offwhite hover:bg-surface-subtle transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-ink">{u.name}</div>
                    <div className="text-xs text-ink-muted">{u.email}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'healthcare_professional' ? 'bg-role-clinician-soft text-role-clinician' : 'bg-role-engineer-soft text-role-engineer'}`}>
                      {roleLabel(t, u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-ink-muted max-w-[180px] truncate">{u.institution}</td>
                  <td className="px-6 py-3.5 text-ink-muted">{new Date(u.createdAt).toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleVerify(u.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-white text-xs font-bold hover:bg-black transition-colors"
                    >
                      <UserCheck size={13} />
                      {t('admin.verification.verify')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

interface PlatformStats {
  usersByRole: Record<string, number>
  postsByStatus: Record<string, number>
  postsByDomain: { domain: string; count: number }[]
  meetingsByStatus: Record<string, number>
  meetingCompletionRate: number
  newUsersLast30: number
  newPostsLast30: number
  /** Sign-ups per day (YYYY-MM-DD in `timezone`) for the last month, plus everyone who joined before it. */
  userGrowth?: { timezone: string; totalBefore: number; daily: { date: string; count: number }[] }
}

/**
 * Keeps a page number valid when the server total shrinks (the last item on the last page was removed, or an
 * old page number no longer exists): steps back to the last real page instead of showing an empty one.
 */
function useClampPage(page: number, setPage: (page: number) => void, total: number | undefined, pageSize: number) {
  useEffect(() => {
    if (total === undefined) return
    const pages = Math.max(1, Math.ceil(total / pageSize))
    if (page > pages) setPage(pages)
  }, [page, setPage, total, pageSize])
}

/** Page numbers with gaps: every page when there are few, otherwise first, last and the neighbours of the current one. */
function pageItems(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const items: (number | 'gap')[] = [1]
  const from = Math.max(2, current - 1)
  const to = Math.min(totalPages - 1, current + 1)
  if (from > 2) items.push('gap')
  for (let p = from; p <= to; p++) items.push(p)
  if (to < totalPages - 1) items.push('gap')
  items.push(totalPages)
  return items
}

/** Range text, an optional page-size control and page buttons, shared by the server-paged admin lists. */
function AdminPager({ page, pageSize, total, onPage, children }: {
  page: number; pageSize: number; total: number; onPage: (page: number) => void; children?: ReactNode
}) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const navCls = 'flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-gray transition hover:border-admin-accent hover:text-admin-accent disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hai-offwhite px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-muted font-semibold">
          {t('admin.users.pageRange', { from: total === 0 ? 0 : (current - 1) * pageSize + 1, to: Math.min(total, current * pageSize), total })}
        </span>
        {children}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current === 1} aria-label={t('admin.users.previousPage')} className={navCls}>
            <ChevronDown size={14} className="rotate-90" />
          </button>
          {pageItems(current, totalPages).map((item, index) => item === 'gap' ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-xs font-black text-ink-muted">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item)}
              aria-current={item === current ? 'page' : undefined}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-black transition ${
                item === current ? 'bg-admin-accent text-white' : 'border border-line text-ink-gray hover:border-admin-accent hover:text-admin-accent'
              }`}
            >
              {item}
            </button>
          ))}
          <button onClick={() => onPage(Math.min(totalPages, current + 1))} disabled={current === totalPages} aria-label={t('admin.users.nextPage')} className={navCls}>
            <ChevronDown size={14} className="-rotate-90" />
          </button>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ users, meetingCount, failedLogins, logs, stats, onNavigate, onExportUsers, navigateTo }: {
  users: User[]
  meetingCount: number; failedLogins: number; logs: ActivityLog[]
  stats: PlatformStats | null
  onNavigate: (v: AdminView) => void
  onExportUsers: () => void
  navigateTo: (path: string) => void
}) {
  const { t } = useTranslation()
  const [overviewPage, setOverviewPage] = useState(1)
  const [chartDays, setChartDays] = useState(7)
  const [showChartMenu, setShowChartMenu] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState(7)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const PAGE_SIZE = 5
  const totalUsers = users.filter(u => u.role !== 'admin').length
  // Platform totals come from /auth/stats; the users list below is only the newest 500, for the recent-members table.
  const activePosts = stats?.postsByStatus.active ?? 0
  const memberCount = stats
    ? Object.entries(stats.usersByRole).filter(([role]) => role !== 'admin').reduce((sum, [, count]) => sum + count, 0)
    : totalUsers
  const nonAdminUsers = [...users].filter(u => u.role !== 'admin').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalPages = Math.max(1, Math.ceil(nonAdminUsers.length / PAGE_SIZE))
  const recentUsers = nonAdminUsers.slice((overviewPage - 1) * PAGE_SIZE, overviewPage * PAGE_SIZE)
  const recentLogs = logs.slice(0, 4)

  const today = new Date()
  const dateRange = `${new Date(today.getTime() - (dateRangeDays - 1) * 86400000).toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short' })} – ${today.toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short', year: 'numeric' })}`
  const RANGE_OPTIONS = [7, 14, 30, 90]
  const CHART_OPTIONS = [7, 14, 30]

  const logIcon = (action: string) => {
    if (action.startsWith('login') || action.startsWith('register')) return { bg: '#fef3c7', emoji: '🔐' }
    if (action.startsWith('post')) return { bg: '#dbeafe', emoji: '📄' }
    if (action.startsWith('meeting')) return { bg: '#d1fae5', emoji: '📅' }
    return { bg: '#ede9fe', emoji: '⚙️' }
  }

  const quickActions: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { label: t('admin.quickActionsList.addUser'),       icon: <UserPlus size={16} strokeWidth={1.8} />,  onClick: () => onNavigate('users') },
    { label: t('admin.quickActionsList.createListing'), icon: <Plus size={16} strokeWidth={1.8} />,      onClick: () => onNavigate('posts') },
    { label: t('admin.quickActionsList.scheduleMeeting'), icon: <Calendar size={16} strokeWidth={1.8} />,  onClick: () => navigateTo(ROUTES.MEETINGS) },
    { label: t('admin.quickActionsList.exportUsers'),   icon: <Download size={16} strokeWidth={1.8} />,  onClick: onExportUsers },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-ink">{t('admin.welcome')}</h1>
          <p className="text-sm text-ink-muted mt-0.5">{t('admin.subtitle')}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDateMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-line text-sm font-semibold text-ink-gray hover:border-admin-accent transition-colors"
          >
            <Calendar size={14} className="text-ink-muted" />
            {dateRange}
            <ChevronDown size={13} className="text-ink-muted" />
          </button>
          {showDateMenu && (
            <div className="absolute right-0 top-10 z-20 bg-white rounded-xl border border-line shadow-lg overflow-hidden min-w-[130px]">
              {RANGE_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDateRangeDays(d); setShowDateMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                    d === dateRangeDays ? 'bg-[#eeecff] text-admin-accent' : 'text-ink-gray hover:bg-[#f5f5ff]'
                  }`}
                >
                  {t('admin.lastNDays', { count: d })}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats — 4-column grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label={t('admin.stats.totalUsers')}     value={memberCount}  icon={<Users size={20} strokeWidth={1.8} />}    iconBg="#ede9fe" iconColor="#7c3aed" change={stats ? `+${stats.newUsersLast30} (30d)` : '…'}  up={true} vsLast7={t('admin.vsLast7Days')} />
        <StatCard label={t('admin.stats.activeListings')} value={activePosts}  icon={<FileText size={20} strokeWidth={1.8} />} iconBg="#dbeafe" iconColor="#2563eb" change={stats ? `+${stats.newPostsLast30} (30d)` : '…'}   up={true} vsLast7={t('admin.vsLast7Days')} />
        <StatCard label={t('admin.stats.meetings')}        value={meetingCount} icon={<Calendar size={20} strokeWidth={1.8} />} iconBg="#fef3c7" iconColor="#d97706" change={stats ? `${stats.meetingCompletionRate}% done` : '…'}  up={true} vsLast7={t('admin.vsLast7Days')} />
        <StatCard label={t('admin.stats.securityEvents')} value={failedLogins} icon={<Shield size={20} strokeWidth={1.8} />}   iconBg="#fee2e2" iconColor="#dc2626" change="last 200 logs"   up={null} vsLast7={t('admin.vsLast7Days')} />
      </div>

      {/* Main + Right panel */}
      <div className="flex gap-5 items-start">
        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* User Growth card — compact */}
          <div className="bg-white rounded-2xl border border-line p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-ink">{t('admin.userGrowth')}</h3>
              <div className="relative">
                <button
                  onClick={() => setShowChartMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line text-xs font-semibold text-ink-muted hover:border-admin-accent transition-colors"
                >
                  {t('admin.lastNDays', { count: chartDays })} <ChevronDown size={12} />
                </button>
                {showChartMenu && (
                  <div className="absolute right-0 top-9 z-20 bg-white rounded-xl border border-line shadow-lg overflow-hidden min-w-[120px]">
                    {CHART_OPTIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => { setChartDays(d); setShowChartMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                          d === chartDays ? 'bg-[#eeecff] text-admin-accent' : 'text-ink-gray hover:bg-[#f5f5ff]'
                        }`}
                      >
                        {t('admin.lastNDays', { count: d })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <UserGrowthChart users={users} days={chartDays} growth={stats?.userGrowth} />
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-hai-offwhite">
              <h3 className="text-base font-black text-ink">{t('admin.recentUsers')}</h3>
              <button onClick={() => onNavigate('users')} className="text-sm font-bold text-admin-accent hover:underline">{t('admin.viewAllUsers')}</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-hai-offwhite">
                  {[t('admin.verification.columns.user'), t('admin.verification.columns.role'), t('admin.verification.columns.institution'), t('admin.posts.columns.status'), t('admin.posts.columns.created'), t('admin.posts.columns.actions')].map(h => (
                    <th key={h} className="text-left text-xs font-bold tracking-[0.12em] uppercase text-ink-muted px-6 py-3 bg-surface-subtle">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => {
                  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={u.id} className="border-b border-surface-subtle last:border-b-0 hover:bg-surface-subtle transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#e0e7ff] flex items-center justify-center text-xs font-black text-admin-accent shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-ink truncate">{u.name}</div>
                            <div className="text-xs text-ink-muted truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.role === 'healthcare_professional' ? 'bg-role-clinician-soft text-role-clinician' : 'bg-role-engineer-soft text-role-engineer'
                        }`}>{roleLabel(t, u.role)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-ink-muted max-w-[160px] truncate">{u.institution}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isSuspended ? 'text-danger-dot' : 'text-success-dot'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-danger-dot' : 'bg-success-dot'}`} />
                          {u.isSuspended ? t('admin.users.suspended') : t('admin.users.active')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-ink-muted">
                        {new Date(u.createdAt).toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => onNavigate('users')}
                          className="p-1.5 rounded-lg hover:bg-hai-offwhite text-ink-muted hover:text-admin-accent transition-colors"
                          title={t('admin.manageUser')}
                        >
                          <span className="text-lg leading-none">⋯</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-6 py-3.5 border-t border-hai-offwhite flex items-center justify-between text-xs text-ink-muted">
              <span>
                {t('admin.showingUsersRange', { from: Math.min((overviewPage - 1) * PAGE_SIZE + 1, totalUsers), to: Math.min(overviewPage * PAGE_SIZE, totalUsers), total: totalUsers })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOverviewPage(p => Math.max(1, p - 1))}
                  disabled={overviewPage === 1}
                  className="w-7 h-7 rounded border border-line flex items-center justify-center text-xs hover:border-admin-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setOverviewPage(page)}
                    className={`w-7 h-7 rounded border flex items-center justify-center text-xs transition-colors ${
                      page === overviewPage
                        ? 'bg-ink text-white border-ink font-bold'
                        : 'border-line text-ink-gray hover:border-admin-accent'
                    }`}
                  >{page}</button>
                ))}
                <button
                  onClick={() => setOverviewPage(p => Math.min(totalPages, p + 1))}
                  disabled={overviewPage === totalPages}
                  className="w-7 h-7 rounded border border-line flex items-center justify-center text-xs hover:border-admin-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >›</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — single card with dividers */}
        <div className="w-[272px] shrink-0 bg-white rounded-2xl border border-line overflow-hidden">
          {/* Quick Actions */}
          <div className="px-5 pt-5 pb-4">
            <h3 className="text-sm font-black text-ink mb-3">{t('admin.quickActions')}</h3>
            <div className="space-y-1">
              {quickActions.map(a => (
                <button key={a.label} onClick={a.onClick}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f5ff] text-ink-gray hover:text-admin-accent transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f0ff] flex items-center justify-center text-admin-accent group-hover:bg-[#e0e0ff] transition-colors">
                      {a.icon}
                    </div>
                    <span className="text-sm font-semibold">{a.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-ink-faint group-hover:text-admin-accent transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-hai-offwhite" />

          {/* Platform metrics */}
          {stats && (
            <>
              <div className="px-5 py-4">
                <h3 className="text-sm font-black text-ink mb-3">{t('admin.topDomains')}</h3>
                <div className="space-y-2">
                  {stats.postsByDomain.slice(0, 5).map(({ domain, count }) => {
                    const max = stats.postsByDomain[0]?.count ?? 1
                    const pct = Math.round((count / max) * 100)
                    return (
                      <div key={domain}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-semibold text-ink-gray truncate max-w-[160px]">{domain}</span>
                          <span className="text-ink-muted font-bold ml-2">{count}</span>
                        </div>
                        <div className="h-1.5 bg-[#f0f1f3] rounded-full overflow-hidden">
                          <div className="h-full bg-admin-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="border-t border-hai-offwhite" />
              <div className="px-5 py-4">
                <h3 className="text-sm font-black text-ink mb-2.5">{t('admin.usersByRole')}</h3>
                <div className="space-y-1.5">
                  {Object.entries(stats.usersByRole).filter(([r]) => r !== 'admin').map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-gray">{roleLabel(t, role)}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${role === 'healthcare_professional' ? 'bg-role-clinician-soft text-role-clinician' : 'bg-role-engineer-soft text-role-engineer'}`}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-hai-offwhite" />
            </>
          )}

          {/* System Status */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-black text-ink mb-2.5">{t('admin.systemStatus')}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-success-dot" />
                <span className="text-xs font-semibold text-success-dot">{t('admin.allOperational')}</span>
              </div>
              <MiniSparkline />
            </div>
            <p className="text-xs text-ink-muted mt-1.5">{t('admin.lastChecked')}</p>
          </div>

          <div className="border-t border-hai-offwhite" />

          {/* Recent Activity */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-ink">{t('admin.recentActivity')}</h3>
              <button onClick={() => onNavigate('logs')} className="text-xs font-bold text-admin-accent hover:underline">{t('admin.viewAll')}</button>
            </div>
            <div className="space-y-3">
              {recentLogs.length > 0 ? recentLogs.map(log => {
                const { bg, emoji } = logIcon(log.action)
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: bg }}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ink-gray leading-snug capitalize">{log.action.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-ink-muted truncate">{log.userEmail}</div>
                    </div>
                    <span className="text-xs text-ink-muted whitespace-nowrap shrink-0">{timeAgo(log.timestamp, t)}</span>
                  </div>
                )
              }) : (
                <p className="text-sm text-ink-muted">{t('admin.noRecentActivity')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function AdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<AdminView>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  // Frequent moderators pick how many rows they see; remembered in this browser.
  const [usersPerPage, setUsersPerPage] = useState(readUsersPageSize)
  const userSearchRef = useRef<HTMLInputElement>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logAction, setLogAction] = useState('')
  const [logResult, setLogResult] = useState('')
  const [logsPage, setLogsPage] = useState(1)
  const [postsPage, setPostsPage] = useState(1)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)

  const [postToRemove, setPostToRemove] = useState<{ id: string; title: string; authorId: string } | null>(null)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleteUserBusy, setDeleteUserBusy] = useState(false)
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null)
  const [suspendError, setSuspendError] = useState<string | null>(null)

  const { remove: removePost } = usePostStore()
  const { push } = useNotificationStore()
  const { meetings, fetchByUser: fetchMeetings } = useMeetingStore()

  useEffect(() => {
    api.get<{ success: boolean; data: { users: (User & { _id?: string })[]; total: number } }>('/auth/users', { params: { limit: 500 } })
      .then(({ data }) => setUsers(data.data.users.map(u => ({ ...u, id: u._id ?? u.id }))))
      .catch(() => {})
    api.get<{ success: boolean; data: PlatformStats }>('/auth/stats', {
      params: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
    })
      .then(({ data }) => setPlatformStats(data.data))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  // Overview summary only (failed sign-ins and recent activity in the last 200 entries); the Logs tab pages on the server.
  useEffect(() => {
    if (view !== 'overview') return
    api.get<{ success: boolean; data: { logs: (ActivityLog & { _id?: string })[]; total: number } }>('/logs', { params: { limit: 200 } })
      .then(({ data }) => setLogs(data.data.logs.map(l => ({ ...l, id: l._id ?? l.id }))))
      .catch(() => {})
  }, [view])

  const logsQuery = useQuery({
    queryKey: ['admin', 'logs', { page: logsPage, action: logAction, result: logResult }],
    queryFn: ({ signal }) => fetchLogs({ page: logsPage, limit: LOGS_PAGE_SIZE, action: logAction, result: logResult }, signal),
    placeholderData: keepPreviousData,
    enabled: view === 'logs',
  })
  const pageLogs = logsQuery.data?.logs ?? []
  const logsTotal = logsQuery.data?.total ?? 0
  useEffect(() => { setLogsPage(1) }, [logAction, logResult])

  // Users are searched and paged on the server; typing is debounced so one request goes out per pause.
  const userSearch = useDebouncedValue(userQuery.trim(), 300)
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { page: usersPage, limit: usersPerPage, search: userSearch }],
    queryFn: ({ signal }) => fetchAdminUsers({ page: usersPage, limit: usersPerPage, search: userSearch }, signal),
    placeholderData: keepPreviousData,
    enabled: view === 'users',
  })
  const pageUsers = usersQuery.data?.users ?? []
  const usersTotal = usersQuery.data?.total ?? 0
  useEffect(() => { setUsersPage(1) }, [userSearch])

  const adminPosts = usePostList({ page: postsPage, limit: POSTS_PAGE_SIZE, sort: 'newest' })
  const adminPostsTotal = adminPosts.data?.total ?? 0

  useClampPage(postsPage, setPostsPage, adminPosts.data?.total, POSTS_PAGE_SIZE)
  useClampPage(usersPage, setUsersPage, usersQuery.data?.total, usersPerPage)
  useClampPage(logsPage, setLogsPage, logsQuery.data?.total, LOGS_PAGE_SIZE)

  const changeUsersPerPage = (size: number) => {
    setUsersPerPage(size)
    setUsersPage(1)
    try { localStorage.setItem(USERS_PAGE_SIZE_KEY, String(size)) } catch { /* private mode: keep it for this visit */ }
  }

  // "/" jumps to the user search, as in GitHub or Gmail — unless the admin is already typing somewhere.
  useEffect(() => {
    if (view !== 'users') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      e.preventDefault()
      userSearchRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [view])

  const handleSuspend = async (userId: string) => {
    const target = pageUsers.find(u => u.id === userId) ?? users.find(u => u.id === userId)
    if (!target) return
    const next = !target.isSuspended
    setSuspendError(null)
    try {
      await api.patch(`/auth/users/${userId}/suspend`, { isSuspended: next })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: next } : u))
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      if (next) push({ userId, type: 'post_closed', title: t('admin.users.suspendedNotifTitle'), body: t('admin.users.suspendedNotifBody'), isRead: false })
    } catch (err: unknown) {
      setSuspendError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('admin.users.suspendError'))
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setDeleteUserBusy(true)
    setDeleteUserError(null)
    try {
      await api.delete(`/auth/users/${userToDelete.id}`)
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setUserToDelete(null)
    } catch (err: unknown) {
      setDeleteUserError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('admin.users.deleteError'))
    } finally {
      setDeleteUserBusy(false)
    }
  }

  const handleRemovePost = async () => {
    if (!postToRemove) return
    setRemoveBusy(true)
    setRemoveError(null)
    try {
      await removePost(postToRemove.id)
      push({ userId: postToRemove.authorId, type: 'post_closed', title: t('admin.posts.removedNotifTitle'), body: t('admin.posts.removedNotifBody'), isRead: false, linkTo: '/posts' })
      setPostToRemove(null)
    } catch (err: unknown) {
      setRemoveError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('admin.posts.removeError'))
    } finally {
      setRemoveBusy(false)
    }
  }

  const memberCount = platformStats
    ? Object.entries(platformStats.usersByRole).filter(([role]) => role !== 'admin').reduce((sum, [, count]) => sum + count, 0)
    : users.filter(u => u.role !== 'admin').length
  const failedLogins = logs.filter(l => l.action === 'login_failed' || l.action === 'register_failed').length
  const selectCls = 'bg-white border border-line rounded-xl px-3 py-2 text-sm text-ink-gray font-semibold outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 transition-colors cursor-pointer'

  const mobileNavItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',     label: t('admin.tabsShort.overview'),     icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
    { id: 'users',        label: t('admin.tabsShort.users'),        icon: <Users size={18} strokeWidth={1.8} /> },
    { id: 'verification', label: t('admin.tabsShort.verification'), icon: <UserCheck size={18} strokeWidth={1.8} /> },
    { id: 'posts',        label: t('admin.tabsShort.posts'),        icon: <FileText size={18} strokeWidth={1.8} /> },
    { id: 'logs',         label: t('admin.tabsShort.logs'),         icon: <Clock size={18} strokeWidth={1.8} /> },
  ]

  return (
    <div className="flex flex-col md:flex-row font-body" style={{ height: 'calc(100vh - 76px)' }}>
      {/* Desktop sidebar — hover-expand, hidden on mobile */}
      <div className="hidden md:flex">
        <AdminSidebar view={view} onNavigate={setView} />
      </div>

      {/* Mobile top tab bar — only visible below md */}
      <nav className="md:hidden flex items-center gap-0.5 overflow-x-auto bg-white border-b border-line px-2 py-2 shrink-0">
        {mobileNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 min-w-[60px] px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              view === item.id
                ? 'bg-[#eeecff] text-admin-accent'
                : 'text-ink-muted hover:bg-[#f5f5ff] hover:text-admin-accent'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* pb-24 lets the last rows and the pager scroll clear of the floating chat bubble (bottom-6, 56 px). */}
      <main className="flex-1 overflow-y-auto bg-[#f3f4f8] pb-24">

        {/* ── OVERVIEW ── */}
        {view === 'overview' && (
          <OverviewTab
            users={users} meetingCount={meetings.length}
            failedLogins={failedLogins} logs={logs} stats={platformStats}
            onNavigate={setView} onExportUsers={() => downloadUsersCSV(users)}
            navigateTo={navigate}
          />
        )}

        {/* ── VERIFICATION QUEUE ── */}
        {view === 'verification' && (
          <VerificationQueueTab />
        )}

        {/* ── USERS ── */}
        {view === 'users' && (
          <div className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-black text-ink">{t('admin.users.title')}</h1>
                <p className="text-sm text-ink-muted">{t('admin.users.registeredCount', { count: memberCount })}</p>
              </div>
            </div>
            {suspendError && (
              <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-danger-line bg-danger-tint px-4 py-3 text-sm font-semibold text-danger-strong">
                <span>{suspendError}</span>
                <button type="button" onClick={() => setSuspendError(null)} aria-label={t('common.close')} className="shrink-0 text-danger-strong hover:text-[#7f1d1d]">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-line overflow-hidden">
              <div className="px-6 py-4 border-b border-hai-offwhite flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input ref={userSearchRef} type="search" value={userQuery} onChange={e => setUserQuery(e.target.value)}
                    placeholder={t('admin.users.searchPlaceholder')}
                    aria-label={t('admin.users.searchPlaceholder')}
                    aria-keyshortcuts="/"
                    className="w-full bg-[#f8f9fb] border border-line rounded-xl pl-10 pr-10 py-2.5 text-sm text-ink-gray outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 transition-colors" />
                  <kbd aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line-strong bg-white px-1.5 font-mono text-xs text-ink-muted">/</kbd>
                </div>
                <span className="text-xs text-ink-muted font-semibold">{t('admin.users.shownCount', { shown: usersTotal, total: memberCount })}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-hai-offwhite">
                      {[t('admin.users.columns.user'), t('admin.users.columns.role'), t('admin.users.columns.institution'), t('admin.users.columns.status'), t('admin.users.columns.lastActive'), t('admin.users.columns.actions')].map(h => (
                        <th key={h} className="text-left text-xs font-bold tracking-[0.12em] uppercase text-ink-muted px-6 py-3 bg-surface-subtle">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageUsers.map(u => {
                      const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      return (
                        <tr key={u.id} className={`border-b border-surface-subtle last:border-b-0 transition-colors ${u.isSuspended ? 'bg-red-50/30' : 'hover:bg-surface-subtle'}`}>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#e0e7ff] flex items-center justify-center text-xs font-black text-admin-accent shrink-0">{initials}</div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-ink truncate">{u.name}</div>
                                <div className="text-xs text-ink-muted truncate">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              u.role === 'healthcare_professional' ? 'bg-role-clinician-soft text-role-clinician' : 'bg-role-engineer-soft text-role-engineer'
                            }`}>{roleLabel(t, u.role)}</span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-ink-muted max-w-[180px] truncate">{u.institution}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isSuspended ? 'text-danger-dot' : 'text-success-dot'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-danger-dot' : 'bg-success-dot'}`} />
                              {u.isSuspended ? t('admin.users.suspended') : t('admin.users.active')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-ink-muted">
                            {new Date(u.lastActive).toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleSuspend(u.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                u.isSuspended ? 'border-success-soft bg-success-wash text-success hover:bg-success-soft'
                                : 'border-danger-soft bg-danger-wash text-danger hover:bg-danger-soft'
                              }`}>
                                {u.isSuspended ? <UserCheck size={13} /> : <UserMinus size={13} />}
                                {u.isSuspended ? t('admin.users.reinstate') : t('admin.users.suspend')}
                              </button>
                              <button onClick={() => { setDeleteUserError(null); setUserToDelete({ id: u.id, name: u.name }) }}
                                className="p-1.5 rounded-lg border border-danger-soft text-danger hover:bg-danger-soft transition-colors" title={t('admin.users.delete')}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {usersTotal > USERS_PAGE_SIZES[0] && (
                <AdminPager page={usersPage} pageSize={usersPerPage} total={usersTotal} onPage={setUsersPage}>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                    {t('admin.users.perPage')}
                    <select
                      value={usersPerPage}
                      onChange={e => changeUsersPerPage(Number(e.target.value))}
                      className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-ink-gray outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                    >
                      {USERS_PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </label>
                </AdminPager>
              )}
            </div>
          </div>
        )}

        {/* ── POSTS ── */}
        {view === 'posts' && (
          <div className="p-3 sm:p-6">
            <div className="mb-5">
              <h1 className="text-xl font-black text-ink">{t('admin.posts.title')}</h1>
              <p className="text-sm text-ink-muted">{t('admin.posts.totalCount', { count: adminPostsTotal })}</p>
            </div>
            <div className="bg-white rounded-2xl border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-hai-offwhite">
                      {[t('admin.posts.columns.title'), t('admin.posts.columns.author'), t('admin.posts.columns.domain'), t('admin.posts.columns.status'), t('admin.posts.columns.created'), t('admin.posts.columns.actions')].map(h => (
                        <th key={h} className="text-left text-xs font-bold tracking-[0.12em] uppercase text-ink-muted px-6 py-3 bg-surface-subtle">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(adminPosts.data?.posts ?? []).map(p => (
                      <tr key={p.id} className="border-b border-surface-subtle last:border-b-0 hover:bg-surface-subtle transition-colors">
                        <td className="px-6 py-3.5 max-w-[280px]">
                          <div className="text-sm font-bold text-ink truncate">{p.title}</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-ink-muted">{p.authorName}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-[#eef3ff] text-admin-accent">{p.domain}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            p.status === 'active'               ? 'bg-success-soft text-success'
                            : p.status === 'partner_found'     ? 'bg-[#ede9fe] text-[#7c3aed]'
                            : p.status === 'meeting_scheduled' ? 'bg-warning-soft text-warning'
                            : 'bg-hai-offwhite text-ink-muted'
                          }`}>{t(`posts.status.${p.status}`, { defaultValue: p.status.replace(/_/g, ' ') })}</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-ink-muted">
                          {new Date(p.createdAt).toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-3.5">
                          <button onClick={() => { setRemoveError(null); setPostToRemove({ id: p.id, title: p.title, authorId: p.authorId }) }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger-soft bg-danger-wash text-danger text-xs font-bold hover:bg-danger-soft transition-colors">
                            <Trash2 size={13} /> {t('admin.posts.remove')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPager page={postsPage} pageSize={POSTS_PAGE_SIZE} total={adminPostsTotal} onPage={setPostsPage} />
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {view === 'logs' && (
          <div className="p-3 sm:p-6">
            <div className="mb-5">
              <h1 className="text-xl font-black text-ink">{t('admin.logs.title')}</h1>
              <p className="text-sm text-ink-muted">{t('admin.logs.subtitle')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-line overflow-hidden">
              <div className="px-6 py-4 border-b border-hai-offwhite flex items-center gap-3 flex-wrap">
                <select value={logAction} onChange={e => setLogAction(e.target.value)} className={selectCls}>
                  <option value="">{t('admin.logs.allActions')}</option>
                  {LOG_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={logResult} onChange={e => setLogResult(e.target.value)} className={selectCls}>
                  <option value="">{t('admin.logs.allResults')}</option>
                  <option value="success">{t('admin.logs.success')}</option>
                  <option value="failure">{t('admin.logs.failure')}</option>
                </select>
                {(logAction || logResult) && (
                  <button onClick={() => { setLogAction(''); setLogResult('') }}
                    className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-ink-gray transition-colors">
                    <X size={13} /> {t('admin.logs.clear')}
                  </button>
                )}
                <span className="text-xs text-ink-muted font-semibold">{logsQuery.isPending ? t('admin.verification.loading') : t('admin.logs.entryCount', { shown: pageLogs.length, total: logsTotal })}</span>
                <button onClick={() => downloadCSV(pageLogs)}
                  className="ml-auto flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors">
                  <Download size={14} /> {t('admin.logs.exportCsv')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr className="border-b border-hai-offwhite">
                      {[t('admin.logs.columns.timestamp'), t('admin.logs.columns.user'), t('admin.logs.columns.role'), t('admin.logs.columns.action'), t('admin.logs.columns.target'), t('admin.logs.columns.result'), t('admin.logs.columns.ip')].map(h => (
                        <th key={h} className="text-left text-xs font-bold tracking-[0.12em] uppercase text-ink-muted px-6 py-3 bg-surface-subtle">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageLogs.map(log => (
                      <tr key={log.id} className={`border-b border-surface-subtle last:border-b-0 transition-colors ${log.result === 'failure' ? 'bg-red-50/30' : 'hover:bg-surface-subtle'}`}>
                        <td className="px-6 py-3 text-xs text-ink-muted whitespace-nowrap font-mono">
                          {new Date(log.timestamp).toLocaleString(uiLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3 text-xs text-ink-gray font-mono whitespace-nowrap">{log.userEmail}</td>
                        <td className="px-6 py-3 text-xs text-ink-muted uppercase tracking-[0.12em]">{roleLabel(t, log.role)}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold ${CRITICAL_LOG_ACTIONS.has(log.action) ? 'text-danger font-bold' : 'text-ink-gray'}`}>
                            {CRITICAL_LOG_ACTIONS.has(log.action) && '⚠ '}{log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-ink-muted font-mono">
                          {log.targetEntityId ?? <span className="text-ink-faint">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            log.result === 'success' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${log.result === 'success' ? 'bg-success-dot' : 'bg-danger-dot'}`} />
                            {log.result === 'success' ? t('admin.logs.success') : t('admin.logs.failure')}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-ink-muted font-mono whitespace-nowrap">
                          {log.ipAddress ?? <span className="text-ink-faint">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPager page={logsPage} pageSize={LOGS_PAGE_SIZE} total={logsTotal} onPage={setLogsPage} />
              <div className="px-6 py-3 border-t border-hai-offwhite flex items-center gap-2 bg-surface-subtle">
                <Shield size={13} className="text-ink-muted" />
                <span className="text-xs text-ink-muted font-semibold">{t('admin.logs.footerNotice')}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {postToRemove && (
        <ConfirmDialog
          title={t('admin.posts.removeConfirmTitle')}
          confirmLabel={removeBusy ? t('common.loading') : t('admin.posts.remove')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleRemovePost}
          onCancel={() => setPostToRemove(null)}
          busy={removeBusy}
          error={removeError}
        >
          <p>{t('admin.posts.removeConfirmBody', { title: postToRemove.title })}</p>
          <p>{t('admin.posts.removeConfirmUndo')}</p>
        </ConfirmDialog>
      )}

      {userToDelete && (
        <ConfirmDialog
          title={t('admin.users.deleteConfirmTitle')}
          confirmLabel={deleteUserBusy ? t('common.loading') : t('admin.users.delete')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
          busy={deleteUserBusy}
          error={deleteUserError}
        >
          <p>{t('admin.users.deleteConfirm', { name: userToDelete.name })}</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
