import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  PieChart,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import { useConversationStore } from '../../store/conversationStore'
import type { Meeting, MeetingStatus, TimeSlot } from '../../types/meeting.types'

type TabId = 'all' | 'incoming' | 'outgoing' | 'pending' | 'confirmed' | 'cancelled'
type SortMode = 'recent' | 'oldest'

const STATUS_LABELS: Record<MeetingStatus, string> = {
  pending: 'Pending review',
  time_proposed: 'Slot selection',
  confirmed: 'Confirmed',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

const STATUS_CLASS: Record<MeetingStatus, string> = {
  pending: 'bg-[var(--pending-bg)] text-[var(--primary)]',
  time_proposed: 'bg-[#FFF3CD] text-[#856404]',
  confirmed: 'bg-[var(--success-bg)] text-[var(--primary)]',
  completed: 'bg-[#D8EFF2] text-[var(--primary)]',
  declined: 'bg-[#ffe8e8] text-[#a33a3a]',
  cancelled: 'bg-[var(--cancelled-bg)] text-[var(--muted)]',
}

export default function MeetingsPage() {
  const { user } = useAuthStore()
  const { meetings, fetchByUser, accept, confirm, decline, cancel, complete } = useMeetingStore()
  const { fetchConversations } = useConversationStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) { fetchByUser(); fetchConversations() }
  }, [fetchByUser, fetchConversations, user])

  const scopedMeetings = useMemo(
    () => user ? meetings.filter(meeting => meeting.requesterId === user.id || meeting.ownerId === user.id) : [],
    [meetings, user],
  )

  const counts = useMemo(() => {
    const incoming = scopedMeetings.filter(meeting => meeting.ownerId === user?.id).length
    const outgoing = scopedMeetings.filter(meeting => meeting.requesterId === user?.id).length
    const pending = scopedMeetings.filter(meeting => meeting.status === 'pending' || meeting.status === 'time_proposed').length
    const confirmed = scopedMeetings.filter(meeting => meeting.status === 'confirmed').length
    const cancelled = scopedMeetings.filter(meeting => meeting.status === 'cancelled' || meeting.status === 'declined').length
    return { all: scopedMeetings.length, incoming, outgoing, pending, confirmed, cancelled }
  }, [scopedMeetings, user?.id])

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'incoming', label: 'Incoming', count: counts.incoming },
    { id: 'outgoing', label: 'Outgoing', count: counts.outgoing },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { id: 'cancelled', label: 'Closed', count: counts.cancelled },
  ]

  const visibleMeetings = useMemo(() => {
    return scopedMeetings
      .filter(meeting => {
        if (activeTab === 'incoming') return meeting.ownerId === user?.id
        if (activeTab === 'outgoing') return meeting.requesterId === user?.id
        if (activeTab === 'pending') return meeting.status === 'pending' || meeting.status === 'time_proposed'
        if (activeTab === 'confirmed') return meeting.status === 'confirmed'
        if (activeTab === 'cancelled') return meeting.status === 'cancelled' || meeting.status === 'declined'
        return true
      })
      .sort((a, b) => {
        const left = meetingTimestamp(a)
        const right = meetingTimestamp(b)
        return sortMode === 'recent' ? right - left : left - right
      })
  }, [activeTab, scopedMeetings, sortMode, user?.id])

  const runAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Meeting action failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{
        '--bg': '#F3F4F6',
        '--surface': '#ffffff',
        '--primary': '#36213E',
        '--accent': '#8AC6D0',
        '--accent-strong': '#6FB8C4',
        '--text': '#36213E',
        '--muted': '#6F6878',
        '--border': '#E3E7EC',
        '--success-bg': '#E8F4F7',
        '--pending-bg': '#D8EFF2',
        '--cancelled-bg': '#EEF0F3',
      } as CSSProperties}
    >
      <section className="mx-auto w-full max-w-[1640px] px-6 pb-20 pt-[72px] md:px-10 2xl:px-0">
        <Hero total={counts.all} />

        <div className="mt-11 flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.41fr)]">
            <MeetingList
              meetings={visibleMeetings}
              userId={user?.id ?? ''}
              busyId={busyId}
              sortValue={sortMode}
              onSortChange={setSortMode}
              onAccept={meeting => runAction(meeting.id, () => accept(meeting.id))}
              onConfirm={(meeting, slot) => runAction(meeting.id, () => confirm(meeting.id, slot))}
              onDecline={(meeting, reason) => runAction(meeting.id, () => decline(meeting.id, reason))}
              onCancel={(meeting, reason) => runAction(meeting.id, () => cancel(meeting.id, reason))}
              onComplete={meeting => runAction(meeting.id, () => complete(meeting.id))}
              onViewAll={() => setActiveTab('all')}
              onOpenChat={meeting => navigate(`/messages?meetingId=${meeting.id}`)}
            />
            <aside>
              <WidgetArea meetings={scopedMeetings} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

function Hero({ total }: { total: number }) {
  return (
    <div>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)] shadow-[0_10px_30px_-24px_rgba(45,24,56,0.5)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          {total} meetings
        </div>

        <h1 className="mt-5 font-headline text-6xl font-black leading-tight tracking-normal text-[var(--primary)] md:text-8xl">
          Your <span className="text-[var(--accent-strong)]">meetings</span>
          <span className="text-[var(--primary)]">.</span>
        </h1>

        <p className="mt-5 max-w-[650px] text-lg leading-8 text-[var(--muted)]">
          Review requests, confirm time slots, and keep your collaboration pipeline in motion.
        </p>
      </div>
    </div>
  )
}

function FilterTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: TabId; label: string; count: number }[]
  activeTab: TabId
  onChange: (tab: TabId) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map(tab => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-12 items-center gap-2.5 rounded-full border px-5 text-sm font-black transition ${
              active
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_12px_28px_-22px_rgba(45,24,56,0.9)]'
                : 'border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--accent)] hover:bg-white'
            }`}
          >
            {tab.label}
            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black ${
                active ? 'bg-[var(--accent)] text-[var(--primary)]' : 'bg-[#EEF0F3] text-[var(--muted)]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SortControl({ value, onChange }: { value: SortMode; onChange: (value: SortMode) => void }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
      <span>Sort by</span>
      <label className="relative">
        <select
          value={value}
          onChange={event => onChange(event.target.value as SortMode)}
          className="h-11 appearance-none rounded-full border border-[var(--border)] bg-white px-4 pr-9 text-sm font-black text-[var(--text)] outline-none transition hover:border-[var(--accent)]"
        >
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest first</option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
      </label>
    </div>
  )
}

function MeetingList({
  meetings,
  userId,
  busyId,
  sortValue,
  onSortChange,
  onAccept,
  onConfirm,
  onDecline,
  onCancel,
  onComplete,
  onViewAll,
  onOpenChat,
}: {
  meetings: Meeting[]
  userId: string
  busyId: string | null
  sortValue: SortMode
  onSortChange: (value: SortMode) => void
  onAccept: (meeting: Meeting) => void
  onConfirm: (meeting: Meeting, slot: TimeSlot) => void
  onDecline: (meeting: Meeting, reason?: string) => void
  onCancel: (meeting: Meeting, reason?: string) => void
  onComplete: (meeting: Meeting) => void
  onViewAll: () => void
  onOpenChat: (meeting: Meeting) => void
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_24px_70px_-54px_rgba(45,24,56,0.5)]">
      <div className="flex min-h-[72px] items-center justify-end border-b border-[var(--border)] px-7">
        <SortControl value={sortValue} onChange={onSortChange} />
      </div>

      {meetings.length > 0 ? (
        meetings.map((meeting, index) => (
          <MeetingRow
            key={meeting.id}
            meeting={meeting}
            userId={userId}
            busy={busyId === meeting.id}
            isLast={index === meetings.length - 1}
            onAccept={() => onAccept(meeting)}
            onConfirm={slot => onConfirm(meeting, slot)}
            onDecline={reason => onDecline(meeting, reason)}
            onCancel={reason => onCancel(meeting, reason)}
            onComplete={() => onComplete(meeting)}
            onOpenChat={() => onOpenChat(meeting)}
          />
        ))
      ) : (
        <div className="px-7 py-16 text-center text-base font-bold text-[var(--muted)]">
          No meetings match this filter.
        </div>
      )}

      <div className="flex h-[76px] items-center justify-center border-t border-[var(--border)]">
        <button onClick={onViewAll} className="text-sm font-black text-[var(--primary)] transition hover:text-[var(--accent-strong)]">
          View all meetings →
        </button>
      </div>
    </section>
  )
}

function MeetingRow({
  meeting,
  userId,
  busy,
  isLast,
  onAccept,
  onConfirm,
  onDecline,
  onCancel,
  onComplete,
  onOpenChat,
}: {
  meeting: Meeting
  userId: string
  busy: boolean
  isLast: boolean
  onAccept: () => void
  onConfirm: (slot: TimeSlot) => void
  onDecline: (reason?: string) => void
  onCancel: (reason?: string) => void
  onComplete: () => void
  onOpenChat: () => void
}) {
  const [confirmMode, setConfirmMode] = useState<'decline' | 'cancel' | null>(null)
  const [reason, setReason] = useState('')

  const isOwner = meeting.ownerId === userId
  const direction = isOwner ? 'Incoming' : 'Outgoing'
  const partner = isOwner ? meeting.requesterName : meeting.ownerName
  const partnerEmail = isOwner ? meeting.requesterEmail : meeting.ownerEmail
  const slot = meeting.confirmedSlot ?? meeting.proposedSlots[0]
  const canAccept = meeting.status === 'pending' && isOwner
  const canChooseSlot = meeting.status === 'time_proposed' && isOwner && meeting.proposedSlots.length > 0

  const handleConfirm = () => {
    const trimmed = reason.trim() || undefined
    if (confirmMode === 'decline') onDecline(trimmed)
    else onCancel(trimmed)
    setConfirmMode(null)
    setReason('')
  }

  const handleAbort = () => { setConfirmMode(null); setReason('') }

  return (
    <article
      className={`grid min-h-[128px] grid-cols-[52px_minmax(0,1fr)_minmax(160px,0.2fr)_minmax(220px,0.24fr)] items-center gap-5 px-7 transition hover:bg-[#F3F4F6] max-lg:grid-cols-[46px_minmax(0,1fr)] max-lg:py-5 ${
        isLast ? '' : 'border-b border-[var(--border)]'
      }`}
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black tracking-[0.12em] text-[var(--accent)]">
        {initials(partner)}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="truncate font-headline text-lg font-black text-[var(--text)]">{meeting.postTitle}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${STATUS_CLASS[meeting.status]}`}>
            {STATUS_LABELS[meeting.status]}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-[var(--muted)]">
          {direction} <span className="px-1.5 text-[#D5DAE0]">•</span> {partner}
          {partnerEmail && (
            <>
              <span className="px-1.5 text-[#D5DAE0]">•</span> {partnerEmail}
            </>
          )}
        </p>
        {(meeting.status === 'pending' || meeting.status === 'time_proposed') && meeting.proposedSlots.length > 0 && (
          <p className="mt-2 text-xs font-bold text-[var(--muted)]">
            {meeting.proposedSlots.length} proposed slots
          </p>
        )}
        {(meeting.status === 'declined' && meeting.declineReason) && (
          <p className="mt-2 text-xs font-semibold text-[#a33a3a]">
            Reason: {meeting.declineReason}
          </p>
        )}
        {(meeting.status === 'cancelled' && meeting.cancelReason) && (
          <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
            Reason: {meeting.cancelReason}
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm font-bold text-[var(--muted)] max-lg:col-start-2">
        {canChooseSlot ? (
          <>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--primary)]" />
              {meeting.proposedSlots.length} options
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--primary)]" />
              Choose one slot
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--primary)]" />
              {slot ? formatSlotDate(slot) : formatDate(meeting.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--primary)]" />
              {slot?.time ?? formatTime(meeting.createdAt)}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 max-lg:col-span-2 max-lg:justify-start">
        {confirmMode ? (
          <div className="flex w-full flex-col gap-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Optional reason for ${confirmMode === 'decline' ? 'declining' : 'cancelling'}…`}
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] outline-none placeholder:text-[#D5DAE0] focus:border-[var(--accent-strong)]"
            />
            <div className="flex justify-end gap-2">
              <ActionButton disabled={false} onClick={handleAbort} tone="quiet">
                Go back
              </ActionButton>
              <ActionButton disabled={busy} onClick={handleConfirm} tone="primary">
                {confirmMode === 'decline' ? 'Confirm decline' : 'Confirm cancel'}
              </ActionButton>
            </div>
          </div>
        ) : (
          <>
            {canAccept && (
              <div className="flex w-full flex-col items-end gap-2">
                <ActionButton disabled={busy} onClick={onAccept} tone="primary">
                  <Check size={14} />
                  Accept request
                </ActionButton>
                <ActionButton disabled={busy} onClick={() => setConfirmMode('decline')} tone="quiet">
                  Decline
                </ActionButton>
              </div>
            )}
            {canChooseSlot && (
              <div className="flex w-full flex-col items-end gap-2">
                <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                  Confirm a proposed slot
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {meeting.proposedSlots.map(slotOption => (
                    <ActionButton key={`${slotOption.date}-${slotOption.time}`} disabled={busy} onClick={() => onConfirm(slotOption)} tone="primary">
                      <Check size={14} />
                      {formatSlotDate(slotOption)} {slotOption.time}
                    </ActionButton>
                  ))}
                </div>
                <ActionButton disabled={busy} onClick={() => setConfirmMode('decline')} tone="quiet">
                  Decline
                </ActionButton>
              </div>
            )}
            {meeting.status === 'pending' && !isOwner && (
              <ActionButton disabled={busy} onClick={() => setConfirmMode('cancel')} tone="quiet">
                Cancel request
              </ActionButton>
            )}
            {meeting.status === 'time_proposed' && !isOwner && (
              <ActionButton disabled={busy} onClick={() => setConfirmMode('cancel')} tone="quiet">
                Cancel request
              </ActionButton>
            )}
            {meeting.status === 'confirmed' && (
              <>
                <ActionButton disabled={busy} onClick={onOpenChat} tone="chat">
                  <MessageSquare size={14} />
                  Open Chat
                </ActionButton>
                <ActionButton disabled={busy} onClick={onComplete} tone="primary">
                  <Check size={14} />
                  Complete
                </ActionButton>
                <ActionButton disabled={busy} onClick={() => setConfirmMode('cancel')} tone="quiet">
                  Cancel
                </ActionButton>
              </>
            )}
            {(meeting.status === 'completed' || meeting.status === 'cancelled' || meeting.status === 'declined') && (
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                No actions
              </span>
            )}
            {meeting.status === 'time_proposed' && isOwner && !canChooseSlot && (
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                Awaiting slot confirmation
              </span>
            )}
          </>
        )}
      </div>
    </article>
  )
}

function ActionButton({
  children,
  disabled,
  onClick,
  tone,
}: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
  tone: 'primary' | 'quiet' | 'chat'
}) {
  const cls = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[#24162B]',
    quiet:   'border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--primary)]',
    chat:    'bg-[#E8F4F7] text-[var(--primary)] border border-[var(--accent)] hover:bg-[var(--success-bg)]',
  }[tone]

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  )
}

function WidgetArea({ meetings }: { meetings: Meeting[] }) {
  const [calendarOpen, setCalendarOpen] = useState(true)
  const [overviewOpen, setOverviewOpen] = useState(true)

  return (
    <div className="relative">
      <div className="mb-6 flex items-start justify-end gap-4 pr-2">
        <IconButton icon={<Calendar size={20} />} label="Open calendar" onClick={() => setCalendarOpen(open => !open)} active={calendarOpen} />
        <IconButton icon={<PieChart size={20} />} label="Open overview" onClick={() => setOverviewOpen(open => !open)} active={overviewOpen} />
      </div>

      <div className="space-y-6">
        {calendarOpen && <CalendarPanel meetings={meetings} onClose={() => setCalendarOpen(false)} />}
        {overviewOpen && <OverviewPanel meetings={meetings} onClose={() => setOverviewOpen(false)} />}
      </div>
    </div>
  )
}

function IconButton({ icon, label, onClick, active }: { icon: ReactNode; label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full border text-[var(--primary)] shadow-[0_18px_45px_-32px_rgba(45,24,56,0.72)] transition hover:border-[var(--accent)] hover:bg-[var(--success-bg)] ${
        active ? 'border-[var(--accent)] bg-[var(--success-bg)]' : 'border-[var(--border)] bg-white'
      }`}
    >
      {icon}
    </button>
  )
}

function CalendarPanel({ meetings, onClose }: { meetings: Meeting[]; onClose: () => void }) {
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay()
  const meetingDays = new Set(
    meetings
      .map(meeting => slotDate(meeting))
      .filter(date => date && date.getFullYear() === year && date.getMonth() === month)
      .map(date => date!.getDate()),
  )

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_28px_70px_-54px_rgba(45,24,56,0.6)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-headline text-lg font-black text-[var(--primary)]">
          {monthCursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMonthCursor(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMonthCursor(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <ChevronRight size={16} />
          </button>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-xs font-black uppercase text-[#6F6878]">
            {day}
          </div>
        ))}
        {Array.from({ length: startOffset }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
          const hasMeeting = meetingDays.has(day)
          return (
            <div key={day} className="flex h-10 items-center justify-center">
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                  hasMeeting ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)]'
                }`}
              >
                {day}
                {hasMeeting && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-white" />}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function OverviewPanel({ meetings, onClose }: { meetings: Meeting[]; onClose: () => void }) {
  const [range, setRange] = useState('month')
  const total = meetings.length
  const legend = [
    { label: 'Pending review', value: meetings.filter(m => m.status === 'pending').length, color: '#D8EFF2' },
    { label: 'Confirmed', value: meetings.filter(m => m.status === 'confirmed').length, color: '#8AC6D0' },
    { label: 'Completed', value: meetings.filter(m => m.status === 'completed').length, color: '#6FB8C4' },
    { label: 'Closed', value: meetings.filter(m => m.status === 'cancelled' || m.status === 'declined').length, color: '#36213E' },
  ]

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_28px_70px_-54px_rgba(45,24,56,0.6)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-headline text-lg font-black text-[var(--primary)]">Meetings overview</h2>
        <div className="flex items-center gap-2">
          <label className="relative">
            <select
              value={range}
              onChange={event => setRange(event.target.value)}
              className="h-9 appearance-none rounded-full border border-[var(--border)] bg-white px-3 pr-8 text-xs font-black text-[var(--text)] outline-none"
            >
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </label>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <DonutChart total={total} legend={legend} />
        <div className="mt-5 w-full space-y-3.5">
          {legend.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2.5 font-bold text-[var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
              <div className="font-black text-[var(--primary)]">
                {item.value} <span className="text-xs text-[var(--muted)]">({percent(item.value, total)})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DonutChart({ total, legend }: { total: number; legend: { value: number; color: string }[] }) {
  const circumference = 421
  let offset = 0

  return (
    <div className="relative h-[178px] w-[178px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r="67" fill="none" stroke="#EEF0F3" strokeWidth="22" />
        {legend.map(item => {
          const length = total ? (item.value / total) * circumference : 0
          const circle = (
            <circle
              key={`${item.color}-${offset}`}
              cx="90"
              cy="90"
              r="67"
              fill="none"
              stroke={item.color}
              strokeWidth="22"
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-offset}
            />
          )
          offset += length
          return circle
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-headline text-3xl font-black leading-none text-[var(--primary)]">{total}</span>
        <span className="mt-1 text-sm font-black text-[var(--muted)]">Total</span>
      </div>
    </div>
  )
}

function meetingTimestamp(meeting: Meeting) {
  const date = slotDate(meeting)
  return date?.getTime() ?? new Date(meeting.createdAt).getTime()
}

function slotDate(meeting: Meeting) {
  const slot = meeting.confirmedSlot ?? meeting.proposedSlots[0]
  return slot ? new Date(`${slot.date}T${slot.time}`) : null
}

function formatSlotDate(slot: TimeSlot) {
  return new Date(`${slot.date}T${slot.time}`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function percent(value: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
