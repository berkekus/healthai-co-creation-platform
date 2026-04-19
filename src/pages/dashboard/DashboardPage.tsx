import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { useMeetingStore } from '../../store/meetingStore'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const allPosts = usePostStore(s => s.posts)
  const allMeetings = useMeetingStore(s => s.meetings)

  const myPosts    = allPosts.filter(p => p.authorId === user?.id)
  const myMeetings = allMeetings.filter(m => m.requesterId === user?.id || m.ownerId === user?.id)
  const activePosts = allPosts.filter(p => p.status === 'active').length

  const stats = [
    { label: 'My Posts',     value: myPosts.length },
    { label: 'My Meetings',  value: myMeetings.length },
    { label: 'Active Listings', value: activePosts },
  ]

  return (
    <PageWrapper>
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40 }}>
        <span style={{ color: 'var(--primary)' }}>04</span> · Dashboard
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,48px)', letterSpacing: '-0.025em', margin: '0 0 8px', color: 'var(--ink)' }}>
        Welcome back, <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{user?.name.split(' ')[0]}</span>.
      </h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: 16, marginBottom: 48, lineHeight: 1.5 }}>
        {user?.role === 'admin' ? 'Platform administrator · ' : ''}
        {user?.institution}
      </p>

      {/* Stats */}
      <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, background: 'var(--rule)', border: '1px solid var(--rule)', marginBottom: 48 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--paper)', padding: '28px 32px' }}>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 48, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{value}</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
        <Link to={ROUTES.POST_CREATE} style={{ padding: '10px 20px', background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          Post an opportunity →
        </Link>
        <Link to={ROUTES.POSTS} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--rule)', fontSize: 14, textDecoration: 'none' }}>
          Browse the directory
        </Link>
        <Link to={ROUTES.MEETINGS} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--rule)', fontSize: 14, textDecoration: 'none' }}>
          View meetings
        </Link>
      </div>

      {/* Recent posts */}
      {myPosts.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--rule-soft)' }}>My recent posts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--rule)' }}>
            {myPosts.slice(0, 4).map(p => (
              <Link key={p.id} to={`/posts/${p.id}`} style={{ background: 'var(--paper)', padding: '12px 18px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', flexShrink: 0 }}>{p.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending meetings */}
      {myMeetings.filter(m => m.status === 'pending' || m.status === 'time_proposed').length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--rule-soft)' }}>Meetings awaiting action</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--rule)' }}>
            {myMeetings.filter(m => m.status === 'pending' || m.status === 'time_proposed').map(m => (
              <Link key={m.id} to={ROUTES.MEETINGS} style={{ background: 'oklch(0.94 0.07 75 / .4)', padding: '12px 18px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.postTitle}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'oklch(0.40 0.10 60)', flexShrink: 0 }}>Action required →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
