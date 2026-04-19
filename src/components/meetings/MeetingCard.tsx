import type { Meeting, TimeSlot } from '../../types/meeting.types'
import { useMeetingStore } from '../../store/meetingStore'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useNavigate } from 'react-router-dom'
import { postDetail } from '../../constants/routes'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: 'Pending Review',    color: 'oklch(0.40 0.10 60)',  bg: 'oklch(0.94 0.07 75)'  },
  time_proposed:    { label: 'Times Proposed',    color: 'oklch(0.28 0.08 220)', bg: 'oklch(0.92 0.05 220)' },
  confirmed:        { label: 'Confirmed',         color: 'oklch(0.32 0.10 145)', bg: 'oklch(0.93 0.06 145)' },
  declined:         { label: 'Declined',          color: 'oklch(0.44 0.08 25)',  bg: 'oklch(0.93 0.04 25)'  },
  cancelled:        { label: 'Cancelled',         color: 'oklch(0.44 0.02 250)', bg: 'oklch(0.93 0.005 240)' },
}

function SlotRow({ slot, onAccept, active }: { slot: TimeSlot; onAccept?: () => void; active?: boolean }) {
  const d = new Date(`${slot.date}T${slot.time}`)
  const fmt = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: active ? 'oklch(0.93 0.06 145)' : 'var(--paper-2)', border: `1px solid ${active ? 'oklch(0.52 0.14 145)' : 'var(--rule)'}` }}>
      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>
        {fmt} · {slot.time}
      </span>
      {onAccept && (
        <button onClick={onAccept} style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '5px 12px', cursor: 'pointer' }}>
          Accept
        </button>
      )}
    </div>
  )
}

interface Props { meeting: Meeting }

export default function MeetingCard({ meeting }: Props) {
  const { user } = useAuthStore()
  const { accept, decline, cancel } = useMeetingStore()
  const { push } = useNotificationStore()
  const navigate = useNavigate()

  const isOwner = user?.id === meeting.ownerId
  const isRequester = user?.id === meeting.requesterId
  const cfg = STATUS_CONFIG[meeting.status]

  const partner = isOwner ? meeting.requesterName : meeting.ownerName

  const handleAccept = (slot: TimeSlot) => {
    accept(meeting.id, slot)
    push({ userId: meeting.requesterId, type: 'meeting_accepted', title: 'Meeting confirmed', body: `${meeting.ownerName} confirmed your meeting slot.`, isRead: false, linkTo: '/meetings' })
    push({ userId: meeting.ownerId, type: 'meeting_accepted', title: 'Meeting confirmed', body: `You confirmed a slot with ${meeting.requesterName}.`, isRead: false, linkTo: '/meetings' })
  }

  const handleDecline = () => {
    decline(meeting.id)
    push({ userId: meeting.requesterId, type: 'meeting_request', title: 'Meeting declined', body: `${meeting.ownerName} declined your meeting request.`, isRead: false, linkTo: '/meetings' })
  }

  const handleCancel = () => {
    cancel(meeting.id)
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }

  return (
    <div style={{ border: '1px solid var(--rule)', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, background: 'var(--paper-2)' }}>
        <div>
          <div style={{ ...mono, marginBottom: 6 }}>
            {isOwner ? 'Incoming request' : 'Outgoing request'} · {partner}
          </div>
          <button
            onClick={() => navigate(postDetail(meeting.postId))}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.3 }}
          >
            {meeting.postTitle}
          </button>
        </div>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', background: cfg.bg, color: cfg.color, padding: '3px 9px', borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {cfg.label}
        </span>
      </div>

      {/* Message */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule-soft)' }}>
        <div style={{ ...mono, marginBottom: 6 }}>Message from {meeting.requesterName}</div>
        <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>{meeting.message}</p>
      </div>

      {/* Confirmed slot */}
      {meeting.status === 'confirmed' && meeting.confirmedSlot && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ ...mono, marginBottom: 8 }}>Confirmed slot</div>
          <SlotRow slot={meeting.confirmedSlot} active />
          <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', margin: '10px 0 0', lineHeight: 1.6 }}>
            Meeting link (Zoom/Teams) to be shared externally. This platform does not host meetings.
          </p>
        </div>
      )}

      {/* Proposed slots — owner actions */}
      {(meeting.status === 'pending' || meeting.status === 'time_proposed') && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ ...mono, marginBottom: 8 }}>Proposed time slots</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {meeting.proposedSlots.map((slot, i) => (
              <SlotRow
                key={i}
                slot={slot}
                onAccept={isOwner && meeting.status !== 'declined' ? () => handleAccept(slot) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {(meeting.status === 'pending' || meeting.status === 'time_proposed') && (
        <div style={{ padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {isOwner && (
            <button onClick={handleDecline} style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--rule)', padding: '8px 16px', cursor: 'pointer', color: '#ef4444' }}>
              Decline
            </button>
          )}
          {isRequester && meeting.status === 'pending' && (
            <button onClick={handleCancel} style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--rule)', padding: '8px 16px', cursor: 'pointer', color: 'var(--ink-muted)' }}>
              Cancel request
            </button>
          )}
        </div>
      )}
    </div>
  )
}
