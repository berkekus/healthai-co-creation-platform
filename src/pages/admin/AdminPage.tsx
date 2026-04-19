import { useState } from 'react'
import { usePostStore } from '../../store/postStore'
import { useNotificationStore } from '../../store/notificationStore'
import PageWrapper from '../../components/layout/PageWrapper'
import { mockUsers } from '../../data/mockUsers'
import { mockLogs } from '../../data/mockLogs'
import type { ActivityLog } from '../../types/common.types'
import type { User } from '../../types/auth.types'

type Tab = 'users' | 'posts' | 'logs'

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Pro',
  admin: 'Admin',
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN_FAILED:           '#ef4444',
  SECURITY_RATE_LIMIT_HIT:'#ef4444',
  USER_SUSPENDED:         '#d97706',
  USER_DEACTIVATED:       '#d97706',
  POST_REMOVED_BY_ADMIN:  '#d97706',
  ADMIN_LOGIN:            'var(--primary)',
}

function downloadCSV(logs: ActivityLog[]) {
  const headers = ['timestamp', 'userId', 'userEmail', 'role', 'action', 'targetEntityId', 'result', 'ipAddress']
  const rows = logs.map(l =>
    headers.map(h => {
      const v = (l as unknown as Record<string, unknown>)[h] ?? ''
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(',')
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

const th: React.CSSProperties = {
  fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase',
  color: 'var(--ink-muted)', padding: '10px 14px', borderBottom: '1px solid var(--rule)',
  textAlign: 'left', background: 'var(--paper-2)', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = {
  fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)',
  padding: '10px 14px', borderBottom: '1px solid var(--rule-soft)', verticalAlign: 'middle',
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([...mockUsers])
  const { posts, remove: removePost } = usePostStore()
  const { push } = useNotificationStore()

  // Log filters
  const [logAction, setLogAction] = useState('')
  const [logResult, setLogResult] = useState('')

  const filteredLogs = mockLogs.filter(l =>
    (!logAction || l.action === logAction) &&
    (!logResult || l.result === logResult)
  )

  const uniqueActions = [...new Set(mockLogs.map(l => l.action))].sort()

  const handleSuspend = (userId: string) => {
    const idx = mockUsers.findIndex(u => u.id === userId)
    if (idx === -1) return
    mockUsers[idx].isSuspended = !mockUsers[idx].isSuspended
    setUsers([...mockUsers])
    const u = mockUsers[idx]
    if (u.isSuspended) {
      push({ userId: u.id, type: 'post_closed', title: 'Account suspended', body: 'Your account has been suspended by an administrator.', isRead: false })
    }
  }

  const handleRemovePost = (postId: string, ownerId: string) => {
    removePost(postId)
    push({ userId: ownerId, type: 'post_closed', title: 'Post removed', body: 'One of your posts was removed by an administrator.', isRead: false, linkTo: '/posts' })
  }

  // Stats
  const totalUsers = users.filter(u => u.role !== 'admin').length
  const suspendedCount = users.filter(u => u.isSuspended).length
  const activePosts = posts.filter(p => p.status === 'active').length
  const failedLogins = mockLogs.filter(l => l.action === 'LOGIN_FAILED' || l.action === 'SECURITY_RATE_LIMIT_HIT').length

  const mono: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase',
        padding: '10px 20px', border: 'none', cursor: 'pointer',
        background: tab === t ? 'var(--ink)' : 'transparent',
        color: tab === t ? 'var(--paper)' : 'var(--ink-muted)',
        borderBottom: tab === t ? 'none' : '1px solid var(--rule)',
        transition: 'background .15s, color .15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <PageWrapper>
      {/* Section label */}
      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 36, display: 'flex', gap: 16, alignItems: 'center' }}>
        <span style={{ color: 'var(--primary)' }}>ADMIN</span>
        <span>Control Panel</span>
        <span style={{ width: 4, height: 4, background: 'var(--ink-muted)', borderRadius: '50%' }} />
        <span>Administrator access only</span>
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(26px,3.5vw,44px)', letterSpacing: '-0.025em', margin: '0 0 32px', color: 'var(--ink)' }}>
        Admin panel.
      </h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 36, background: 'var(--rule)' }}>
        {[
          { label: 'Total users',     value: totalUsers },
          { label: 'Suspended',       value: suspendedCount },
          { label: 'Active listings', value: activePosts },
          { label: 'Security events', value: failedLogins },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--paper)', padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 32, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)', marginBottom: 28 }}>
        {tabBtn('users', 'Users')}
        {tabBtn('posts', 'Posts')}
        {tabBtn('logs',  'Activity Logs')}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--rule)' }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Institution', 'Status', 'Last active', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role !== 'admin').map(u => (
                <tr key={u.id} style={{ background: u.isSuspended ? 'color-mix(in oklab, #ef4444 5%, var(--paper))' : 'var(--paper)' }}>
                  <td style={td}>{u.name}</td>
                  <td style={{ ...td, fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{u.email}</td>
                  <td style={td}>{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.institution}</td>
                  <td style={td}>
                    <span style={{
                      fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 2,
                      background: u.isSuspended ? 'oklch(0.93 0.04 25)' : 'oklch(0.93 0.06 145)',
                      color: u.isSuspended ? '#ef4444' : 'oklch(0.32 0.10 145)',
                    }}>
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: 11, color: 'var(--ink-muted)' }}>
                    {new Date(u.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => handleSuspend(u.id)}
                      style={{
                        fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
                        background: 'none', border: `1px solid ${u.isSuspended ? 'oklch(0.52 0.14 145)' : '#ef4444'}`,
                        color: u.isSuspended ? 'oklch(0.32 0.10 145)' : '#ef4444',
                        padding: '4px 10px', cursor: 'pointer',
                      }}
                    >
                      {u.isSuspended ? 'Reinstate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── POSTS TAB ── */}
      {tab === 'posts' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--rule)' }}>
            <thead>
              <tr>
                {['Title', 'Author', 'Domain', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ background: 'var(--paper)' }}>
                  <td style={{ ...td, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--ff-sans)', fontSize: 13 }}>{p.title}</td>
                  <td style={td}>{p.authorName}</td>
                  <td style={{ ...td, fontSize: 11, color: 'var(--ink-muted)' }}>{p.domain}</td>
                  <td style={td}>
                    <span style={{
                      fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 2,
                      background: p.status === 'active' ? 'oklch(0.93 0.06 145)' : 'oklch(0.93 0.005 240)',
                      color: p.status === 'active' ? 'oklch(0.32 0.10 145)' : 'oklch(0.44 0.02 250)',
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: 11, color: 'var(--ink-muted)' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => handleRemovePost(p.id, p.authorId)}
                      style={{
                        fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
                        background: 'none', border: '1px solid #ef4444', color: '#ef4444',
                        padding: '4px 10px', cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div>
          {/* Filters + export */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={logAction}
              onChange={e => setLogAction(e.target.value)}
              style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, background: 'var(--paper)', border: '1px solid var(--rule)', padding: '8px 12px', color: 'var(--ink)', cursor: 'pointer' }}
            >
              <option value="">All actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={logResult}
              onChange={e => setLogResult(e.target.value)}
              style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, background: 'var(--paper)', border: '1px solid var(--rule)', padding: '8px 12px', color: 'var(--ink)', cursor: 'pointer' }}
            >
              <option value="">All results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', marginLeft: 4 }}>
              {filteredLogs.length} of {mockLogs.length} entries
            </span>
            <button
              onClick={() => downloadCSV(filteredLogs)}
              style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '9px 18px', cursor: 'pointer' }}
            >
              ↓ Export CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--rule)', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Timestamp', 'User', 'Role', 'Action', 'Target', 'Result', 'IP'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={{ background: log.result === 'failure' ? 'color-mix(in oklab, #ef4444 4%, var(--paper))' : 'var(--paper)' }}>
                    <td style={{ ...td, fontSize: 11, whiteSpace: 'nowrap', color: 'var(--ink-muted)' }}>
                      {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ ...td, fontSize: 11 }}>{log.userEmail}</td>
                    <td style={{ ...td, fontSize: 10, color: 'var(--ink-muted)' }}>{ROLE_LABEL[log.role] ?? log.role}</td>
                    <td style={{ ...td, color: ACTION_COLORS[log.action] ?? 'var(--ink)', fontWeight: ACTION_COLORS[log.action] ? 600 : 400 }}>
                      {log.action}
                    </td>
                    <td style={{ ...td, fontSize: 11, color: 'var(--ink-muted)' }}>{log.targetEntityId ?? '—'}</td>
                    <td style={td}>
                      <span style={{
                        fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 2,
                        background: log.result === 'success' ? 'oklch(0.93 0.06 145)' : 'oklch(0.93 0.04 25)',
                        color: log.result === 'success' ? 'oklch(0.32 0.10 145)' : '#ef4444',
                      }}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 11, color: 'var(--ink-muted)' }}>{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '.08em' }}>
            Logs are tamper-resistant. No deletion permitted. Retention period: 24 months.
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
