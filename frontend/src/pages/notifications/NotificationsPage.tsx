import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import PageWrapper from '../../components/layout/PageWrapper'

const TYPE_ICON: Record<string, string> = {
  meeting_request:  '📩',
  meeting_accepted: '✅',
  meeting_declined: '❌',
  meeting_cancelled:'🚫',
  post_closed:      '📋',
  partner_found:    '🤝',
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const { getByUser, markRead, markAllRead } = useNotificationStore()
  const navigate = useNavigate()
  const notifications = user ? getByUser(user.id) : []
  const hasUnread = notifications.some(n => !n.isRead)

  const handleClick = (id: string, linkTo?: string) => {
    markRead(id)
    if (linkTo) navigate(linkTo)
  }

  const mono: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  }

  return (
    <PageWrapper maxWidth={640}>
      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: 'var(--primary)' }}>18</span>
          <span>Notifications</span>
          {hasUnread && (
            <span style={{ background: 'var(--accent)', color: 'var(--paper)', fontFamily: 'var(--ff-mono)', fontSize: 9.5, padding: '2px 7px', borderRadius: 2 }}>
              {notifications.filter(n => !n.isRead).length} unread
            </span>
          )}
        </div>
        {hasUnread && (
          <button
            onClick={() => user && markAllRead(user.id)}
            style={{ ...mono, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
          >
            Mark all read
          </button>
        )}
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.025em', margin: '0 0 32px', color: 'var(--ink)' }}>
        Notifications.
      </h1>

      {notifications.length === 0 ? (
        <div style={{ padding: '48px 32px', textAlign: 'center', border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <p style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', margin: '0 0 8px' }}>All clear.</p>
          <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--rule)' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n.id, n.linkTo)}
              style={{
                background: n.isRead ? 'var(--paper)' : 'color-mix(in oklab, var(--primary) 5%, var(--paper))',
                padding: '18px 24px', cursor: n.linkTo ? 'pointer' : 'default',
                display: 'flex', gap: 16, alignItems: 'flex-start',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (n.linkTo) (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)' }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.isRead ? 'var(--paper)' : 'color-mix(in oklab, var(--primary) 5%, var(--paper))'}
            >
              <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{TYPE_ICON[n.type] ?? '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span>{n.title}</span>
                  {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 8, letterSpacing: '.06em' }}>
                  {new Date(n.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  {n.linkTo && <span style={{ marginLeft: 10, color: 'var(--primary)' }}>View →</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
