import type { Meeting, MeetingStatus, TimeSlot } from '../../types/meeting.types'
import { useMeetingStore } from '../../store/meetingStore'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { postDetail } from '../../constants/routes'

type Tone = { label: string; bg: string; text: string; dot: string; icon: string }

const STATUS_CONFIG: Record<MeetingStatus, Tone> = {
  pending:       { label: 'Pending review',  bg: 'bg-hai-lime',          text: 'text-hai-plum',    dot: 'bg-hai-plum',    icon: 'pending' },
  time_proposed: { label: 'Slot selection',  bg: 'bg-amber-50',          text: 'text-amber-700',   dot: 'bg-amber-400',   icon: 'schedule' },
  confirmed:     { label: 'Confirmed',       bg: 'bg-hai-plum',          text: 'text-hai-mint',    dot: 'bg-hai-mint',    icon: 'check_circle' },
  completed:     { label: 'Completed',       bg: 'bg-hai-teal',          text: 'text-hai-plum',    dot: 'bg-hai-plum',    icon: 'task_alt' },
  declined:      { label: 'Declined',        bg: 'bg-red-50',            text: 'text-red-600',     dot: 'bg-red-500',     icon: 'block' },
  cancelled:     { label: 'Cancelled',       bg: 'bg-neutral-100',       text: 'text-neutral-500', dot: 'bg-neutral-400', icon: 'cancel' },
}

function formatSlot(slot: TimeSlot) {
  const d = new Date(`${slot.date}T${slot.time}`)
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return { date, time: slot.time }
}

function SlotChip({ slot, onAccept, active }: { slot: TimeSlot; onAccept?: () => void; active?: boolean }) {
  const { date, time } = formatSlot(slot)
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 border transition-colors ${
      active
        ? 'bg-hai-lime border-hai-plum/30'
        : 'bg-hai-offwhite border-neutral-200'
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-hai-plum text-lg shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>
          {active ? 'event_available' : 'event'}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-body font-bold text-hai-plum truncate">{date}</div>
          <div className="text-xs font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold">at {time}</div>
        </div>
      </div>
      {onAccept && (
        <button
          onClick={onAccept}
          className="shrink-0 px-3.5 py-1.5 rounded-full bg-hai-plum text-white text-xs font-mono tracking-[0.12em] uppercase font-bold hover:bg-black transition-colors inline-flex items-center gap-1"
        >
          Accept <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}

interface Props { meeting: Meeting }

export default function MeetingCard({ meeting }: Props) {
  const { user } = useAuthStore()
  const { accept, confirm, decline, cancel, complete } = useMeetingStore()
  const navigate = useNavigate()

  const isOwner     = user?.id === meeting.ownerId
  const isRequester = user?.id === meeting.requesterId
  const cfg = STATUS_CONFIG[meeting.status]

  const partnerName = isOwner ? meeting.requesterName : meeting.ownerName
  const partnerInitials = partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const canAccept = meeting.status === 'pending' && isOwner
  const canChooseSlot = meeting.status === 'time_proposed' && isOwner
  const partnerEmail = isOwner ? meeting.requesterEmail : meeting.ownerEmail

  const handleAccept = () => accept(meeting.id)
  const handleConfirm = (slot: TimeSlot) => confirm(meeting.id, slot)
  const handleDecline = () => decline(meeting.id)
  const handleCancel = () => cancel(meeting.id)

  return (
    <article className="bg-white rounded-[1.5rem] border border-neutral-100 overflow-hidden shadow-[0_10px_40px_-20px_rgba(54,33,62,0.1)] font-body">

      {/* Header */}
      <div className="px-5 md:px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-10 h-10 rounded-full bg-hai-plum text-hai-mint flex items-center justify-center font-mono font-bold text-xs tracking-[0.12em]">
            {partnerInitials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold mb-0.5">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>
                {isOwner ? 'call_received' : 'call_made'}
              </span>
              {isOwner ? 'Incoming from' : 'Outgoing to'} · <span className="text-hai-plum">{partnerName}</span>
            </div>
            <button
              onClick={() => navigate(postDetail(meeting.postId))}
              className="block text-left font-headline font-bold text-lg md:text-lg leading-snug tracking-normal text-hai-plum hover:text-black transition-colors truncate max-w-full"
              title={meeting.postTitle}
            >
              {meeting.postTitle}
            </button>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono tracking-[0.12em] uppercase font-bold whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Message */}
      <div className="px-5 md:px-6 pb-4">
        <div className="bg-hai-offwhite rounded-2xl p-4">
          <div className="text-xs font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
            Message from {meeting.requesterName}
          </div>
          <p className="text-sm text-hai-plum leading-relaxed">{meeting.message}</p>
        </div>
      </div>

      {/* Confirmed slot */}
      {(meeting.status === 'confirmed' || meeting.status === 'completed') && meeting.confirmedSlot && (
        <div className="px-5 md:px-6 pb-4">
          <div className="text-xs font-mono tracking-[0.16em] uppercase text-hai-plum font-bold mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>event_available</span>
            Confirmed slot
          </div>
          <SlotChip slot={meeting.confirmedSlot} active />

          {/* Partner contact */}
          {partnerEmail && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-hai-mint/30 border border-hai-teal/30 rounded-2xl">
              <span className="material-symbols-outlined text-hai-plum text-base shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>mail</span>
              <div className="min-w-0">
                <div className="text-xs font-mono tracking-[0.12em] uppercase text-hai-plum/60 font-bold mb-0.5">Contact</div>
                <a
                  href={`mailto:${partnerEmail}`}
                  className="text-sm font-mono font-bold text-hai-plum hover:text-hai-teal transition-colors truncate block"
                >
                  {partnerEmail}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meeting Done button */}
      {meeting.status === 'confirmed' && (
        <div className="px-5 md:px-6 py-3 border-t border-neutral-100 bg-hai-offwhite/50 flex items-center justify-end">
          <button
            onClick={() => complete(meeting.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-hai-teal text-hai-plum text-xs font-mono tracking-[0.12em] uppercase font-bold hover:bg-hai-mint transition-colors"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>task_alt</span>
            Görüşme yapıldı
          </button>
        </div>
      )}

      {/* Step 1: pending — accept or decline */}
      {canAccept && (
        <div className="px-5 md:px-6 py-3 border-t border-neutral-100 bg-hai-offwhite/50 flex items-center gap-2 justify-end flex-wrap">
          <button
            onClick={handleDecline}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-red-200 text-red-600 text-xs font-mono tracking-[0.12em] uppercase font-bold hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">block</span>
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-hai-plum text-hai-mint text-xs font-mono tracking-[0.12em] uppercase font-bold hover:bg-black transition-colors"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Accept request
          </button>
        </div>
      )}

      {/* Step 2: time_proposed — choose a slot */}
      {canChooseSlot && (
        <div className="px-5 md:px-6 pb-4">
          <div className="text-xs font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">schedule</span>
            Confirm a time slot · {meeting.proposedSlots.length} options
          </div>
          <div className="flex flex-col gap-2">
            {meeting.proposedSlots.map((slot, i) => (
              <SlotChip
                key={i}
                slot={slot}
                onAccept={() => handleConfirm(slot)}
              />
            ))}
          </div>
          <button
            onClick={handleDecline}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-red-200 text-red-600 text-xs font-mono tracking-[0.12em] uppercase font-bold hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">block</span>
            Decline
          </button>
        </div>
      )}

      {/* Requester cancel for pending / time_proposed */}
      {isRequester && (meeting.status === 'pending' || meeting.status === 'time_proposed') && (
        <div className="px-5 md:px-6 py-3 border-t border-neutral-100 bg-hai-offwhite/50 flex items-center gap-2 justify-end">
          {meeting.status === 'time_proposed' && (
            <p className="mr-auto text-xs font-mono tracking-[0.12em] text-neutral-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">hourglass_top</span>
              Waiting for slot confirmation
            </p>
          )}
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-500 text-xs font-mono tracking-[0.12em] uppercase font-bold hover:bg-neutral-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
            Cancel request
          </button>
        </div>
      )}
    </article>
  )
}
