import { useEffect, useMemo, useState } from 'react'
import { usePostStore } from '../../store/postStore'
import { useNotificationStore } from '../../store/notificationStore'
import PageWrapper from '../../components/layout/PageWrapper'
import api from '../../lib/api'
import type { ActivityLog } from '../../types/common.types'
import type { User } from '../../types/auth.types'

type TabId = 'users' | 'posts' | 'logs'

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Pro',
  admin: 'Admin',
}

const ROLE_ICON: Record<string, string> = {
  engineer: 'memory',
  healthcare_professional: 'stethoscope',
  admin: 'admin_panel_settings',
}

const CRITICAL_ACTIONS = new Set([
  'login_failed',
  'register_failed',
  'user_suspend',
  'post_delete',
])

const selectStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1.5px solid #E5E5E5',
  borderRadius: 9999,
  padding: '8px 32px 8px 14px',
  fontSize: 12,
  fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  fontWeight: 600,
  color: '#36213E',
  outline: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2336213E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  cursor: 'pointer',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

function downloadCSV(logs: ActivityLog[]) {
  const headers = ['timestamp', 'userId', 'userEmail', 'role', 'action', 'targetEntityId', 'result', 'ipAddress']
  const rows = logs.map(l =>
    headers.map(h => {
      const v = (l as unknown as Record<string, unknown>)[h] ?? ''
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(','),
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `healthai-logs-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({
  label, value, icon, tone,
}: {
  label: string
  value: number | string
  icon: string
  tone: 'teal' | 'mint' | 'lime' | 'cream' | 'plum'
}) {
  const ring = {
    teal:  'from-hai-teal/30',
    mint:  'from-hai-mint',
    lime:  'from-hai-lime',
    cream: 'from-hai-cream',
    plum:  'from-hai-plum/20',
  }[tone]
  const iconBg = {
    teal:  'bg-hai-teal/20 text-hai-plum',
    mint:  'bg-hai-mint text-hai-plum',
    lime:  'bg-hai-lime text-hai-plum',
    cream: 'bg-hai-cream text-hai-plum',
    plum:  'bg-hai-plum text-hai-mint',
  }[tone]
  return (
    <div className="relative bg-white rounded-[1.5rem] border border-neutral-100 p-5 overflow-hidden">
      <div className={`absolute -top-4 -right-4 w-28 h-28 pointer-events-none opacity-60 rounded-full bg-gradient-radial ${ring}`}
           style={{ background: `radial-gradient(circle, var(--tw-gradient-from) 0%, transparent 70%)` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
            {label}
          </div>
          <div className="font-headline font-bold text-[34px] leading-none tracking-[-0.03em] text-hai-plum">
            {value}
          </div>
        </div>
        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>('users')

  const [users, setUsers] = useState<User[]>([])
  const [userQuery, setUserQuery] = useState('')

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logAction, setLogAction] = useState('')
  const [logResult, setLogResult] = useState('')

  const { posts, remove: removePost } = usePostStore()
  const { push } = useNotificationStore()

  useEffect(() => {
    api.get<{ success: boolean; data: { id: string; _id?: string }[] }>('/auth/users')
      .then(({ data }) => {
        const normalised = data.data.map((u) => ({ ...u, id: u._id ?? u.id })) as User[]
        setUsers(normalised)
      })
      .catch(() => {/* non-critical — keep empty */})
  }, [])

  useEffect(() => {
    if (tab !== 'logs') return
    setLogsLoading(true)
    api.get<{ success: boolean; data: { logs: ActivityLog[]; total: number } }>('/logs', {
      params: { limit: 200 },
    })
      .then(({ data }) => setLogs(data.data.logs.map(l => ({ ...l, id: (l as ActivityLog & { _id?: string })._id ?? l.id }))))
      .catch(() => {/* keep empty */})
      .finally(() => setLogsLoading(false))
  }, [tab])

  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))].sort(), [logs])

  const filteredLogs = useMemo(() => logs.filter(l =>
    (!logAction || l.action === logAction) &&
    (!logResult || l.result === logResult),
  ), [logs, logAction, logResult])

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    return users.filter(u => u.role !== 'admin' && (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.institution.toLowerCase().includes(q)
    ))
  }, [users, userQuery])

  const handleSuspend = async (userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return
    const nextSuspended = !target.isSuspended
    try {
      await api.put(`/auth/users/${userId}/suspend`, { isSuspended: nextSuspended })
    } catch {/* optimistic — update locally anyway */}
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: nextSuspended } : u))
    if (nextSuspended) {
      push({ userId, type: 'post_closed', title: 'Account suspended', body: 'Your account has been suspended by an administrator.', isRead: false })
    }
  }

  const handleRemovePost = async (postId: string, ownerId: string) => {
    await removePost(postId)
    push({ userId: ownerId, type: 'post_closed', title: 'Post removed', body: 'One of your posts was removed by an administrator.', isRead: false, linkTo: '/posts' })
  }

  const totalUsers     = users.filter(u => u.role !== 'admin').length
  const suspendedCount = users.filter(u => u.isSuspended).length
  const activePosts    = posts.filter(p => p.status === 'active').length
  const failedLogins   = logs.filter(l => l.action === 'LOGIN_FAILED' || l.action === 'SECURITY_RATE_LIMIT_HIT').length

  const tabs: { id: TabId; label: string; icon: string; count: number }[] = [
    { id: 'users', label: 'Users',         icon: 'group',   count: totalUsers },
    { id: 'posts', label: 'Posts',         icon: 'article', count: posts.length },
    { id: 'logs',  label: 'Activity logs', icon: 'history', count: logs.length },
  ]

  return (
    <PageWrapper maxWidth={1280}>
      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-plum text-hai-mint rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase font-bold">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              admin_panel_settings
            </span>
            Admin · Restricted
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-headline font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-[-0.035em] text-hai-plum">
                Control panel<span className="text-hai-teal">.</span>
              </h1>
              <p className="text-[15px] text-neutral-600 leading-relaxed mt-3 max-w-xl">
                Moderate accounts, audit listings, and export security logs — all actions are recorded and tamper-resistant.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {suspendedCount > 0 && (
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-4 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {suspendedCount} suspended
                </div>
              )}
              {failedLogins > 0 && (
                <div className="inline-flex items-center gap-2 bg-hai-lime text-hai-plum rounded-full px-4 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-hai-plum" />
                  {failedLogins} security events
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total users"     value={totalUsers}     icon="group"             tone="mint"  />
        <StatCard label="Suspended"       value={suspendedCount} icon="person_off"        tone="cream" />
        <StatCard label="Active listings" value={activePosts}    icon="article"           tone="lime"  />
        <StatCard label="Security events" value={failedLogins}   icon="shield"            tone="plum"  />
      </div>

      {/* Tab row */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[11.5px] font-mono tracking-[0.14em] uppercase font-bold transition-colors ${
                active
                  ? 'bg-hai-plum text-white'
                  : 'bg-white border border-neutral-200 text-hai-plum hover:bg-hai-mint/40'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: '"FILL" 1' }}>{t.icon}</span>
              {t.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] px-1.5 font-bold ${
                active ? 'bg-hai-mint text-hai-plum' : 'bg-hai-offwhite text-hai-plum'
              }`}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div className="bg-white rounded-[1.75rem] border border-neutral-100 overflow-hidden font-body">
          <div className="px-5 md:px-6 py-4 border-b border-neutral-100 bg-hai-offwhite flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-hai-plum/50 text-[18px] pointer-events-none">
                search
              </span>
              <input
                type="search"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                placeholder="Search by name, email, or institution…"
                className="w-full bg-white border-2 border-transparent rounded-full pl-11 pr-4 py-2.5 text-[13px] font-body font-medium text-hai-plum placeholder:text-neutral-400 focus:border-hai-plum outline-none transition-colors"
              />
            </div>
            <span className="text-[10.5px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">
              {filteredUsers.length} of {totalUsers} shown
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr>
                  {['Member', 'Role', 'Institution', 'Status', 'Last active', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold px-5 py-3 bg-hai-offwhite/60 border-b border-neutral-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={u.id} className={`border-b border-neutral-100 last:border-b-0 transition-colors ${u.isSuspended ? 'bg-red-50/40' : 'hover:bg-hai-mint/20'}`}>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-hai-plum text-hai-mint flex items-center justify-center font-mono font-bold text-[11px] tracking-[0.06em]">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-body font-bold text-[13.5px] text-hai-plum truncate">{u.name}</div>
                            <div className="font-mono text-[11px] text-neutral-500 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 bg-hai-offwhite text-hai-plum rounded-full px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] uppercase font-bold whitespace-nowrap">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                            {ROLE_ICON[u.role] ?? 'person'}
                          </span>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="text-[12.5px] text-neutral-600 font-body truncate max-w-[220px] inline-block align-bottom">{u.institution}</span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] uppercase font-bold whitespace-nowrap ${
                          u.isSuspended ? 'bg-red-50 text-red-600' : 'bg-hai-mint text-hai-plum'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${u.isSuspended ? 'bg-red-500' : 'bg-hai-teal'}`} />
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle font-mono text-[11.5px] text-neutral-500 whitespace-nowrap">
                        {new Date(u.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <button
                          onClick={() => handleSuspend(u.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10.5px] font-mono tracking-[0.1em] uppercase font-bold transition-colors whitespace-nowrap ${
                            u.isSuspended
                              ? 'bg-white border border-hai-plum text-hai-plum hover:bg-hai-mint/40'
                              : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {u.isSuspended ? 'person_add' : 'block'}
                          </span>
                          {u.isSuspended ? 'Reinstate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── POSTS ── */}
      {tab === 'posts' && (
        <div className="bg-white rounded-[1.75rem] border border-neutral-100 overflow-hidden font-body">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr>
                  {['Title', 'Author', 'Domain', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold px-5 py-3 bg-hai-offwhite/60 border-b border-neutral-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-hai-mint/20 transition-colors">
                    <td className="px-5 py-4 align-middle max-w-[320px]">
                      <div className="font-body font-bold text-[13.5px] text-hai-plum truncate">{p.title}</div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className="text-[12.5px] text-neutral-600 font-body">{p.authorName}</span>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 bg-hai-mint/60 text-hai-plum rounded-full px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] uppercase font-bold whitespace-nowrap">
                        <span className="w-1 h-1 rounded-full bg-hai-teal" />
                        {p.domain}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] uppercase font-bold whitespace-nowrap ${
                        p.status === 'active'            ? 'bg-hai-mint text-hai-plum' :
                        p.status === 'partner_found'     ? 'bg-hai-plum text-hai-mint' :
                        p.status === 'meeting_scheduled' ? 'bg-hai-lime text-hai-plum' :
                        p.status === 'expired'           ? 'bg-hai-cream/60 text-neutral-500' :
                                                          'bg-neutral-100 text-neutral-500'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle font-mono text-[11.5px] text-neutral-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <button
                        onClick={() => handleRemovePost(p.id, p.authorId)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-red-200 text-red-600 text-[10.5px] font-mono tracking-[0.1em] uppercase font-bold hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <div className="bg-white rounded-[1.75rem] border border-neutral-100 overflow-hidden font-body">
          <div className="px-5 md:px-6 py-4 border-b border-neutral-100 bg-hai-offwhite flex items-center gap-2.5 flex-wrap">
            <select
              value={logAction}
              onChange={e => setLogAction(e.target.value)}
              style={selectStyle}
              aria-label="Filter by action"
            >
              <option value="">All actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={logResult}
              onChange={e => setLogResult(e.target.value)}
              style={selectStyle}
              aria-label="Filter by result"
            >
              <option value="">All results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
            {(logAction || logResult) && (
              <button
                onClick={() => { setLogAction(''); setLogResult('') }}
                className="inline-flex items-center gap-1 text-[10.5px] font-mono tracking-[0.12em] uppercase font-bold text-neutral-500 hover:text-hai-plum transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Clear
              </button>
            )}
            <span className="text-[10.5px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">
              {logsLoading ? 'Loading…' : `${filteredLogs.length} of ${logs.length} entries`}
            </span>
            <button
              onClick={() => downloadCSV(filteredLogs)}
              className="ml-auto inline-flex items-center gap-1.5 bg-hai-plum text-white rounded-full px-4 py-2 text-[10.5px] font-mono tracking-[0.12em] uppercase font-bold hover:bg-black transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[920px]">
              <thead>
                <tr>
                  {['Timestamp', 'User', 'Role', 'Action', 'Target', 'Result', 'IP'].map(h => (
                    <th key={h} className="text-left text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold px-5 py-3 bg-hai-offwhite/60 border-b border-neutral-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log: ActivityLog) => {
                  const isCritical = CRITICAL_ACTIONS.has(log.action)
                  return (
                    <tr key={log.id} className={`border-b border-neutral-100 last:border-b-0 ${log.result === 'failure' ? 'bg-red-50/30' : 'hover:bg-hai-mint/15'} transition-colors`}>
                      <td className="px-5 py-3 align-middle font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 align-middle font-mono text-[11.5px] text-hai-plum font-medium whitespace-nowrap">{log.userEmail}</td>
                      <td className="px-5 py-3 align-middle">
                        <span className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-neutral-500">
                          {ROLE_LABEL[log.role] ?? log.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <span className={`inline-flex items-center font-mono text-[11px] tracking-[0.06em] ${
                          isCritical ? 'text-red-600 font-bold' : 'text-hai-plum font-semibold'
                        }`}>
                          {isCritical && (
                            <span className="material-symbols-outlined text-[13px] mr-1" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
                          )}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle font-mono text-[11px] text-neutral-500">
                        {log.targetEntityId ?? <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-mono tracking-[0.1em] uppercase font-bold ${
                          log.result === 'success' ? 'bg-hai-mint text-hai-plum' : 'bg-red-50 text-red-600'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${log.result === 'success' ? 'bg-hai-teal' : 'bg-red-500'}`} />
                          {log.result}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {log.ipAddress ?? <span className="text-neutral-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 md:px-6 py-3 border-t border-neutral-100 bg-hai-offwhite/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-hai-plum/60 text-[15px]" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
            <span className="text-[10.5px] font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold">
              Logs are tamper-resistant · No deletion permitted · Retention 24 months
            </span>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
