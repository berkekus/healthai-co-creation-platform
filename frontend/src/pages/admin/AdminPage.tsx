import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart2, Calendar, CheckCircle, ChevronRight, Clock,
  Download, FileText, Headphones, LayoutDashboard, Plus,
  Settings, Shield, Trash2, UserCheck, UserMinus, UserPlus,
  Users, X, Search, ChevronDown,
} from 'lucide-react'
import { usePostStore } from '../../store/postStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useMeetingStore } from '../../store/meetingStore'
import api from '../../lib/api'
import type { ActivityLog } from '../../types/common.types'
import type { User } from '../../types/auth.types'
import { ROUTES } from '../../constants/routes'

type AdminView = 'overview' | 'users' | 'posts' | 'logs'

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Pro',
  admin: 'Admin',
}

const CRITICAL_ACTIONS = new Set(['login_failed', 'register_failed', 'user_suspend', 'post_delete'])

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

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── HOVER-EXPAND SIDEBAR ──────────────────────────────────
function AdminSidebar({ view, onNavigate }: { view: AdminView; onNavigate: (v: AdminView) => void }) {
  const mainViews = new Set<AdminView>(['overview', 'users', 'posts', 'logs'])

  const navItems: { id: string; label: string; icon: React.ReactNode; route?: string }[] = [
    { id: 'overview',  label: 'Overview',        icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
    { id: 'users',     label: 'Users',            icon: <Users size={18} strokeWidth={1.8} /> },
    { id: 'posts',     label: 'Posts & Listings', icon: <FileText size={18} strokeWidth={1.8} /> },
    { id: 'logs',      label: 'Activity Logs',    icon: <Clock size={18} strokeWidth={1.8} /> },
    { id: 'meetings',  label: 'Meetings',         icon: <Calendar size={18} strokeWidth={1.8} />, route: ROUTES.MEETINGS },
    { id: 'security',  label: 'Security',         icon: <Shield size={18} strokeWidth={1.8} /> },
    { id: 'reports',   label: 'Reports',          icon: <BarChart2 size={18} strokeWidth={1.8} /> },
    { id: 'settings',  label: 'Settings',         icon: <Settings size={18} strokeWidth={1.8} /> },
  ]

  return (
    <aside className="group/sb flex flex-col bg-white border-r border-[#eaecf0] shrink-0 overflow-x-hidden w-[56px] hover:w-[220px] transition-all duration-200">
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.id === view
          const isDisabled = !mainViews.has(item.id as AdminView) && !item.route

          if (item.route) {
            return (
              <Link key={item.id} to={item.route}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[#6b7280] hover:bg-[#f5f5ff] hover:text-[#4f46e5] transition-colors">
                <span className="shrink-0">{item.icon}</span>
                <span className="text-[13px] font-semibold whitespace-nowrap opacity-0 group-hover/sb:opacity-100 transition-opacity duration-150 delay-75">{item.label}</span>
              </Link>
            )
          }

          return (
            <button key={item.id}
              onClick={() => !isDisabled && mainViews.has(item.id as AdminView) && onNavigate(item.id as AdminView)}
              disabled={isDisabled}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors w-full text-left ${
                isActive     ? 'bg-[#eeecff] text-[#4f46e5]'
                : isDisabled ? 'text-[#c8ccd4] cursor-default'
                : 'text-[#6b7280] hover:bg-[#f5f5ff] hover:text-[#4f46e5]'
              }`}>
              <span className="shrink-0">{item.icon}</span>
              <span className="text-[13px] font-semibold whitespace-nowrap opacity-0 group-hover/sb:opacity-100 transition-opacity duration-150 delay-75">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Need help */}
      <div className="m-2 p-3 bg-[#f8f8ff] rounded-xl border border-[#eeeeff] overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Headphones size={16} strokeWidth={1.8} className="text-[#4f46e5] shrink-0" />
          <span className="text-[12px] font-black text-[#18203a] whitespace-nowrap opacity-0 group-hover/sb:opacity-100 transition-opacity duration-150 delay-75">Need help?</span>
        </div>
        <svg viewBox="0 0 80 24" className="w-full opacity-40 mb-2">
          <path d="M0,18 C10,14 15,20 25,12 C35,4 40,16 50,10 C60,4 70,14 80,8"
            fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] text-[#9ca3af] leading-relaxed whitespace-nowrap overflow-hidden opacity-0 group-hover/sb:opacity-100 transition-opacity duration-150 delay-75 mb-2">
          Our support team is here to help you.
        </p>
        <a
          href="mailto:support@healthai.edu"
          className="flex items-center gap-1 text-[11.5px] font-bold text-[#4f46e5] whitespace-nowrap opacity-0 group-hover/sb:opacity-100 transition-opacity duration-150 delay-75 hover:underline"
        >
          Contact Support <ChevronRight size={12} />
        </a>
      </div>
    </aside>
  )
}

// ── STAT CARD ─────────────────────────────────────────────
function StatCard({ label, value, icon, iconBg, iconColor, change, up }: {
  label: string; value: number; icon: React.ReactNode
  iconBg: string; iconColor: string; change: string; up: boolean | null
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#eaecf0] p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <div className="text-[34px] font-black text-[#18203a] leading-none">{value}</div>
      </div>
      <div className="text-[13px] text-[#6b7280] font-semibold mb-1.5">{label}</div>
      <div className={`text-[12px] font-semibold ${up === true ? 'text-[#22c55e]' : up === false ? 'text-[#ef4444]' : 'text-[#9ca3af]'}`}>
        {up === true ? '↑' : up === false ? '↓' : '—'} {change}
        <span className="text-[#b0b7c3] font-normal ml-1">vs last 7 days</span>
      </div>
    </div>
  )
}

// ── USER GROWTH CHART ─────────────────────────────────────
function UserGrowthChart({ users, days }: { users: User[]; days: number }) {
  const today = new Date()
  const pts = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
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
      {yTicks.map(v => {
        const y = pT + plotH - (v / maxVal) * plotH
        return (
          <g key={v}>
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
function OverviewTab({ users, posts, meetingCount, failedLogins, logs, onNavigate, onExportUsers, navigateTo }: {
  users: User[]
  posts: { domain: string; status: string; title: string; authorName: string; createdAt: string; id: string; authorId: string }[]
  meetingCount: number; failedLogins: number; logs: ActivityLog[]
  onNavigate: (v: AdminView) => void
  onExportUsers: () => void
  navigateTo: (path: string) => void
}) {
  const [overviewPage, setOverviewPage] = useState(1)
  const [chartDays, setChartDays] = useState(7)
  const [showChartMenu, setShowChartMenu] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState(7)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const PAGE_SIZE = 5
  const totalUsers = users.filter(u => u.role !== 'admin').length
  const activePosts = posts.filter(p => p.status === 'active').length
  const nonAdminUsers = [...users].filter(u => u.role !== 'admin').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalPages = Math.max(1, Math.ceil(nonAdminUsers.length / PAGE_SIZE))
  const recentUsers = nonAdminUsers.slice((overviewPage - 1) * PAGE_SIZE, overviewPage * PAGE_SIZE)
  const recentLogs = logs.slice(0, 4)

  const today = new Date()
  const dateRange = `${new Date(today.getTime() - (dateRangeDays - 1) * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const RANGE_OPTIONS = [7, 14, 30, 90]
  const CHART_OPTIONS = [7, 14, 30]

  const logIcon = (action: string) => {
    if (action.startsWith('login') || action.startsWith('register')) return { bg: '#fef3c7', emoji: '🔐' }
    if (action.startsWith('post')) return { bg: '#dbeafe', emoji: '📄' }
    if (action.startsWith('meeting')) return { bg: '#d1fae5', emoji: '📅' }
    return { bg: '#ede9fe', emoji: '⚙️' }
  }

  const quickActions: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { label: 'Add new user',       icon: <UserPlus size={16} strokeWidth={1.8} />,  onClick: () => onNavigate('users') },
    { label: 'Create new listing', icon: <Plus size={16} strokeWidth={1.8} />,      onClick: () => onNavigate('posts') },
    { label: 'Schedule meeting',   icon: <Calendar size={16} strokeWidth={1.8} />,  onClick: () => navigateTo(ROUTES.MEETINGS) },
    { label: 'Export users CSV',   icon: <Download size={16} strokeWidth={1.8} />,  onClick: onExportUsers },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-[#18203a]">Welcome back, Admin 👋</h1>
          <p className="text-[13.5px] text-[#9ca3af] mt-0.5">Here's what's happening on HealthAI today.</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDateMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#eaecf0] text-[13px] font-semibold text-[#374151] hover:border-[#4f46e5] transition-colors"
          >
            <Calendar size={14} className="text-[#9ca3af]" />
            {dateRange}
            <ChevronDown size={13} className="text-[#9ca3af]" />
          </button>
          {showDateMenu && (
            <div className="absolute right-0 top-10 z-20 bg-white rounded-xl border border-[#eaecf0] shadow-lg overflow-hidden min-w-[130px]">
              {RANGE_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDateRangeDays(d); setShowDateMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    d === dateRangeDays ? 'bg-[#eeecff] text-[#4f46e5]' : 'text-[#374151] hover:bg-[#f5f5ff]'
                  }`}
                >
                  Last {d} days
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats — 4-column grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users"     value={totalUsers}   icon={<Users size={20} strokeWidth={1.8} />}    iconBg="#ede9fe" iconColor="#7c3aed" change="12%"  up={true} />
        <StatCard label="Active Listings" value={activePosts}  icon={<FileText size={20} strokeWidth={1.8} />} iconBg="#dbeafe" iconColor="#2563eb" change="8%"   up={true} />
        <StatCard label="Meetings"        value={meetingCount} icon={<Calendar size={20} strokeWidth={1.8} />} iconBg="#fef3c7" iconColor="#d97706" change="24%"  up={true} />
        <StatCard label="Security Events" value={failedLogins} icon={<Shield size={20} strokeWidth={1.8} />}   iconBg="#fee2e2" iconColor="#dc2626" change="0%"   up={null} />
      </div>

      {/* Main + Right panel */}
      <div className="flex gap-5 items-start">
        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* User Growth card — compact */}
          <div className="bg-white rounded-2xl border border-[#eaecf0] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-black text-[#18203a]">User growth</h3>
              <div className="relative">
                <button
                  onClick={() => setShowChartMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#eaecf0] text-[12px] font-semibold text-[#6b7280] hover:border-[#4f46e5] transition-colors"
                >
                  Last {chartDays} days <ChevronDown size={12} />
                </button>
                {showChartMenu && (
                  <div className="absolute right-0 top-9 z-20 bg-white rounded-xl border border-[#eaecf0] shadow-lg overflow-hidden min-w-[120px]">
                    {CHART_OPTIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => { setChartDays(d); setShowChartMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-[12px] font-semibold transition-colors ${
                          d === chartDays ? 'bg-[#eeecff] text-[#4f46e5]' : 'text-[#374151] hover:bg-[#f5f5ff]'
                        }`}
                      >
                        Last {d} days
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <UserGrowthChart users={users} days={chartDays} />
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-[15px] font-black text-[#18203a]">Recent users</h3>
              <button onClick={() => onNavigate('users')} className="text-[13px] font-bold text-[#4f46e5] hover:underline">View all users</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f3f4f6]">
                  {['User', 'Role', 'Institution', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] px-6 py-3 bg-[#fafafa]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => {
                  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={u.id} className="border-b border-[#f9fafb] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[11px] font-black text-[#4f46e5] shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-bold text-[#18203a] truncate">{u.name}</div>
                            <div className="text-[11.5px] text-[#9ca3af] truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.role === 'healthcare_professional' ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#d1fae5] text-[#059669]'
                        }`}>{ROLE_LABEL[u.role] ?? u.role}</span>
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-[#6b7280] max-w-[160px] truncate">{u.institution}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${u.isSuspended ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`} />
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-[#9ca3af]">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => onNavigate('users')}
                          className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#4f46e5] transition-colors"
                          title="Manage user"
                        >
                          <span className="text-[18px] leading-none">⋯</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-6 py-3.5 border-t border-[#f3f4f6] flex items-center justify-between text-[12.5px] text-[#9ca3af]">
              <span>
                Showing {Math.min((overviewPage - 1) * PAGE_SIZE + 1, totalUsers)}–{Math.min(overviewPage * PAGE_SIZE, totalUsers)} of {totalUsers} users
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOverviewPage(p => Math.max(1, p - 1))}
                  disabled={overviewPage === 1}
                  className="w-7 h-7 rounded border border-[#eaecf0] flex items-center justify-center text-[12px] hover:border-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setOverviewPage(page)}
                    className={`w-7 h-7 rounded border flex items-center justify-center text-[12px] transition-colors ${
                      page === overviewPage
                        ? 'bg-[#18203a] text-white border-[#18203a] font-bold'
                        : 'border-[#eaecf0] text-[#374151] hover:border-[#4f46e5]'
                    }`}
                  >{page}</button>
                ))}
                <button
                  onClick={() => setOverviewPage(p => Math.min(totalPages, p + 1))}
                  disabled={overviewPage === totalPages}
                  className="w-7 h-7 rounded border border-[#eaecf0] flex items-center justify-center text-[12px] hover:border-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >›</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — single card with dividers */}
        <div className="w-[272px] shrink-0 bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
          {/* Quick Actions */}
          <div className="px-5 pt-5 pb-4">
            <h3 className="text-[14px] font-black text-[#18203a] mb-3">Quick actions</h3>
            <div className="space-y-1">
              {quickActions.map(a => (
                <button key={a.label} onClick={a.onClick}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f5ff] text-[#374151] hover:text-[#4f46e5] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f0ff] flex items-center justify-center text-[#4f46e5] group-hover:bg-[#e0e0ff] transition-colors">
                      {a.icon}
                    </div>
                    <span className="text-[13px] font-semibold">{a.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-[#c8ccd4] group-hover:text-[#4f46e5] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#f3f4f6]" />

          {/* System Status */}
          <div className="px-5 py-4">
            <h3 className="text-[14px] font-black text-[#18203a] mb-2.5">System status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-[#22c55e]" />
                <span className="text-[12.5px] font-semibold text-[#22c55e]">All systems operational</span>
              </div>
              <MiniSparkline />
            </div>
            <p className="text-[11.5px] text-[#9ca3af] mt-1.5">Last checked: 2 min ago</p>
          </div>

          <div className="border-t border-[#f3f4f6]" />

          {/* Recent Activity */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-black text-[#18203a]">Recent activity</h3>
              <button onClick={() => onNavigate('logs')} className="text-[12px] font-bold text-[#4f46e5] hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {recentLogs.length > 0 ? recentLogs.map(log => {
                const { bg, emoji } = logIcon(log.action)
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px]" style={{ backgroundColor: bg }}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#374151] leading-snug capitalize">{log.action.replace(/_/g, ' ')}</div>
                      <div className="text-[11px] text-[#9ca3af] truncate">{log.userEmail}</div>
                    </div>
                    <span className="text-[11px] text-[#b0b7c3] whitespace-nowrap shrink-0">{timeAgo(log.timestamp)}</span>
                  </div>
                )
              }) : (
                <p className="text-[13px] text-[#b0b7c3]">No recent activity</p>
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
  const navigate = useNavigate()
  const [view, setView] = useState<AdminView>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logAction, setLogAction] = useState('')
  const [logResult, setLogResult] = useState('')

  const { posts, fetchPosts, remove: removePost } = usePostStore()
  const { push } = useNotificationStore()
  const { meetings, fetchByUser: fetchMeetings } = useMeetingStore()

  useEffect(() => {
    api.get<{ success: boolean; data: { users: (User & { _id?: string })[]; total: number } }>('/auth/users', { params: { limit: 200 } })
      .then(({ data }) => setUsers(data.data.users.map(u => ({ ...u, id: u._id ?? u.id }))))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])
  useEffect(() => { fetchPosts({ limit: 200 }) }, [fetchPosts])

  useEffect(() => {
    if (view !== 'logs' && view !== 'overview') return
    setLogsLoading(true)
    api.get<{ success: boolean; data: { logs: (ActivityLog & { _id?: string })[]; total: number } }>('/logs', { params: { limit: 200 } })
      .then(({ data }) => setLogs(data.data.logs.map(l => ({ ...l, id: l._id ?? l.id }))))
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }, [view])

  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))].sort(), [logs])
  const filteredLogs = useMemo(() => logs.filter(l =>
    (!logAction || l.action === logAction) && (!logResult || l.result === logResult)
  ), [logs, logAction, logResult])

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    return users.filter(u => u.role !== 'admin' && (
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.institution.toLowerCase().includes(q)
    ))
  }, [users, userQuery])

  const handleSuspend = async (userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return
    const next = !target.isSuspended
    try { await api.put(`/auth/users/${userId}/suspend`, { isSuspended: next }) } catch {}
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: next } : u))
    if (next) push({ userId, type: 'post_closed', title: 'Account suspended', body: 'Your account has been suspended.', isRead: false })
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Permanently delete "${userName}"? This cannot be undone.`)) return
    try {
      await api.delete(`/auth/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not delete account.')
    }
  }

  const handleRemovePost = async (postId: string, ownerId: string) => {
    await removePost(postId)
    push({ userId: ownerId, type: 'post_closed', title: 'Post removed', body: 'One of your posts was removed by an administrator.', isRead: false, linkTo: '/posts' })
  }

  const totalNonAdmin = users.filter(u => u.role !== 'admin').length
  const failedLogins = logs.filter(l => l.action === 'login_failed' || l.action === 'register_failed').length
  const selectCls = 'bg-white border border-[#eaecf0] rounded-xl px-3 py-2 text-[13px] text-[#374151] font-semibold outline-none focus:border-[#4f46e5] transition-colors cursor-pointer'

  return (
    <div className="flex font-body" style={{ height: 'calc(100vh - 76px)' }}>
      <AdminSidebar view={view} onNavigate={setView} />

      <main className="flex-1 overflow-y-auto bg-[#f3f4f8]">

        {/* ── OVERVIEW ── */}
        {view === 'overview' && (
          <OverviewTab
            users={users} posts={posts} meetingCount={meetings.length}
            failedLogins={failedLogins} logs={logs} onNavigate={setView}
            onExportUsers={() => downloadUsersCSV(users)}
            navigateTo={navigate}
          />
        )}

        {/* ── USERS ── */}
        {view === 'users' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-[20px] font-black text-[#18203a]">Users</h1>
                <p className="text-[13px] text-[#9ca3af]">{totalNonAdmin} registered members</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input type="search" value={userQuery} onChange={e => setUserQuery(e.target.value)}
                    placeholder="Search name, email, institution…"
                    className="w-full bg-[#f8f9fb] border border-[#eaecf0] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#374151] outline-none focus:border-[#4f46e5] transition-colors" />
                </div>
                <span className="text-[12px] text-[#9ca3af] font-semibold">{filteredUsers.length} of {totalNonAdmin} shown</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      {['User', 'Role', 'Institution', 'Status', 'Last Active', 'Actions'].map(h => (
                        <th key={h} className="text-left text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] px-6 py-3 bg-[#fafafa]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      return (
                        <tr key={u.id} className={`border-b border-[#f9fafb] last:border-b-0 transition-colors ${u.isSuspended ? 'bg-red-50/30' : 'hover:bg-[#fafafa]'}`}>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[11px] font-black text-[#4f46e5] shrink-0">{initials}</div>
                              <div className="min-w-0">
                                <div className="text-[13.5px] font-bold text-[#18203a] truncate">{u.name}</div>
                                <div className="text-[11.5px] text-[#9ca3af] truncate">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'healthcare_professional' ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#d1fae5] text-[#059669]'
                            }`}>{ROLE_LABEL[u.role] ?? u.role}</span>
                          </td>
                          <td className="px-6 py-3.5 text-[13px] text-[#6b7280] max-w-[180px] truncate">{u.institution}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${u.isSuspended ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`} />
                              {u.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-[12.5px] text-[#9ca3af]">
                            {new Date(u.lastActive).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleSuspend(u.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                                u.isSuspended ? 'border-[#d1fae5] bg-[#f0fdf4] text-[#059669] hover:bg-[#d1fae5]'
                                : 'border-[#fee2e2] bg-[#fff7f7] text-[#dc2626] hover:bg-[#fee2e2]'
                              }`}>
                                {u.isSuspended ? <UserCheck size={13} /> : <UserMinus size={13} />}
                                {u.isSuspended ? 'Reinstate' : 'Suspend'}
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 rounded-lg border border-[#fee2e2] text-[#dc2626] hover:bg-[#fee2e2] transition-colors" title="Delete">
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
            </div>
          </div>
        )}

        {/* ── POSTS ── */}
        {view === 'posts' && (
          <div className="p-6">
            <div className="mb-5">
              <h1 className="text-[20px] font-black text-[#18203a]">Posts & Listings</h1>
              <p className="text-[13px] text-[#9ca3af]">{posts.length} total listings</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      {['Title', 'Author', 'Domain', 'Status', 'Created', 'Actions'].map(h => (
                        <th key={h} className="text-left text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] px-6 py-3 bg-[#fafafa]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(p => (
                      <tr key={p.id} className="border-b border-[#f9fafb] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                        <td className="px-6 py-3.5 max-w-[280px]">
                          <div className="text-[13.5px] font-bold text-[#18203a] truncate">{p.title}</div>
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-[#6b7280]">{p.authorName}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#eef3ff] text-[#4f46e5]">{p.domain}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            p.status === 'active'               ? 'bg-[#d1fae5] text-[#059669]'
                            : p.status === 'partner_found'     ? 'bg-[#ede9fe] text-[#7c3aed]'
                            : p.status === 'meeting_scheduled' ? 'bg-[#fef3c7] text-[#d97706]'
                            : 'bg-[#f3f4f6] text-[#9ca3af]'
                          }`}>{p.status.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-6 py-3.5 text-[12.5px] text-[#9ca3af]">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-3.5">
                          <button onClick={() => handleRemovePost(p.id, p.authorId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#fee2e2] bg-[#fff7f7] text-[#dc2626] text-[12px] font-bold hover:bg-[#fee2e2] transition-colors">
                            <Trash2 size={13} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {view === 'logs' && (
          <div className="p-6">
            <div className="mb-5">
              <h1 className="text-[20px] font-black text-[#18203a]">Activity Logs</h1>
              <p className="text-[13px] text-[#9ca3af]">Tamper-resistant · Retention 24 months</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#eaecf0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center gap-3 flex-wrap">
                <select value={logAction} onChange={e => setLogAction(e.target.value)} className={selectCls}>
                  <option value="">All actions</option>
                  {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={logResult} onChange={e => setLogResult(e.target.value)} className={selectCls}>
                  <option value="">All results</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                </select>
                {(logAction || logResult) && (
                  <button onClick={() => { setLogAction(''); setLogResult('') }}
                    className="flex items-center gap-1 text-[12px] font-bold text-[#9ca3af] hover:text-[#374151] transition-colors">
                    <X size={13} /> Clear
                  </button>
                )}
                <span className="text-[12px] text-[#9ca3af] font-semibold">{logsLoading ? 'Loading…' : `${filteredLogs.length} of ${logs.length} entries`}</span>
                <button onClick={() => downloadCSV(filteredLogs)}
                  className="ml-auto flex items-center gap-2 bg-[#18203a] text-white px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-black transition-colors">
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      {['Timestamp', 'User', 'Role', 'Action', 'Target', 'Result', 'IP'].map(h => (
                        <th key={h} className="text-left text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] px-6 py-3 bg-[#fafafa]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} className={`border-b border-[#f9fafb] last:border-b-0 transition-colors ${log.result === 'failure' ? 'bg-red-50/30' : 'hover:bg-[#fafafa]'}`}>
                        <td className="px-6 py-3 text-[12px] text-[#9ca3af] whitespace-nowrap font-mono">
                          {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3 text-[12.5px] text-[#374151] font-mono whitespace-nowrap">{log.userEmail}</td>
                        <td className="px-6 py-3 text-[12px] text-[#9ca3af] uppercase tracking-wide">{ROLE_LABEL[log.role] ?? log.role}</td>
                        <td className="px-6 py-3">
                          <span className={`text-[12.5px] font-semibold ${CRITICAL_ACTIONS.has(log.action) ? 'text-[#dc2626] font-bold' : 'text-[#374151]'}`}>
                            {CRITICAL_ACTIONS.has(log.action) && '⚠ '}{log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[12px] text-[#9ca3af] font-mono">
                          {log.targetEntityId ?? <span className="text-[#d1d5db]">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            log.result === 'success' ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#fee2e2] text-[#dc2626]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${log.result === 'success' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                            {log.result}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[12px] text-[#9ca3af] font-mono whitespace-nowrap">
                          {log.ipAddress ?? <span className="text-[#d1d5db]">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-[#f3f4f6] flex items-center gap-2 bg-[#fafafa]">
                <Shield size={13} className="text-[#9ca3af]" />
                <span className="text-[11.5px] text-[#9ca3af] font-semibold">Logs are tamper-resistant · No deletion permitted · Retention 24 months</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
