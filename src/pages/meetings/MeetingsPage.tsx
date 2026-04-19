import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import MeetingCard from '../../components/meetings/MeetingCard'
import PageWrapper from '../../components/layout/PageWrapper'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function MeetingsPage() {
  const { user } = useAuthStore()
  const { getByUser } = useMeetingStore()
  const navigate = useNavigate()

  const all = user ? getByUser(user.id) : []
  const incoming = all.filter(m => m.ownerId === user?.id)
  const outgoing = all.filter(m => m.requesterId === user?.id)

  const mono: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  }

  const pending = incoming.filter(m => m.status === 'pending' || m.status === 'time_proposed').length

  return (
    <PageWrapper>
      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--primary)' }}>11</span>
        <span>Meetings</span>
        <span style={{ width: 4, height: 4, background: 'var(--ink-muted)', borderRadius: '50%' }} />
        <span>{all.length} total</span>
        {pending > 0 && (
          <span style={{ background: 'oklch(0.94 0.07 75)', color: 'oklch(0.40 0.10 60)', fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2 }}>
            {pending} awaiting action
          </span>
        )}
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-0.025em', margin: '0 0 40px', color: 'var(--ink)' }}>
        Your meetings.
      </h1>

      {all.length === 0 ? (
        <div style={{ padding: '60px 32px', textAlign: 'center', border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <p style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', margin: '0 0 10px' }}>No meetings yet.</p>
          <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Browse collaboration posts and express interest to schedule a meeting.
          </p>
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '12px 28px', cursor: 'pointer' }}
          >
            Browse Directory →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          {/* Incoming */}
          {incoming.length > 0 && (
            <section>
              <div style={{ ...mono, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>Incoming requests</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-muted)', display: 'inline-block' }} />
                <span>{incoming.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {incoming.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </section>
          )}

          {/* Outgoing */}
          {outgoing.length > 0 && (
            <section>
              <div style={{ ...mono, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>Outgoing requests</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-muted)', display: 'inline-block' }} />
                <span>{outgoing.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {outgoing.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </section>
          )}

        </div>
      )}
    </PageWrapper>
  )
}
