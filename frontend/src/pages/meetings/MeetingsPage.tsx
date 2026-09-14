import { useEffect, useMemo, useState, useCallback } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Calendar,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  MessageSquare,
  PieChart,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import { useConversationStore } from '../../store/conversationStore'
import { usePostStore } from '../../store/postStore'
import type { Meeting, MeetingStatus, TimeSlot } from '../../types/meeting.types'
import type { PostStatus } from '../../types/post.types'
import api from '../../lib/api'
import { exportSummaryToPdf } from '../../utils/pdfExport'
import { postDetail } from '../../constants/routes'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ProposeTimesModal from '../../components/meetings/ProposeTimesModal'
import { CHAT_OPEN_STATUSES, MEETING_STATUS_STYLE, meetingRole } from '../../utils/meetingStatus'
import { browserTimeZone, describeSlot } from '../../utils/timeSlots'

type TabId = 'all' | 'incoming' | 'outgoing' | 'pending' | 'confirmed' | 'held' | 'cancelled'
type SortMode = 'recent' | 'oldest'

/** Posts in these states can still be closed with "Partner Found". */
const CLOSABLE_POST_STATUSES: PostStatus[] = ['active', 'meeting_scheduled', 'expired']

export default function MeetingsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { meetings, fetchByUser, accept, confirm, decline, cancel, complete, reschedule } = useMeetingStore()
  const { fetchConversations } = useConversationStore()
  const navigate = useNavigate()
  const location = useLocation()
  const requestSentTo = (location.state as { requestSentTo?: string } | null)?.requestSentTo
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [proposeFor, setProposeFor] = useState<Meeting | null>(null)
  const [partnerFoundFor, setPartnerFoundFor] = useState<Meeting | null>(null)
  const [partnerFoundBusy, setPartnerFoundBusy] = useState(false)
  const [partnerFoundError, setPartnerFoundError] = useState<string | null>(null)
  const viewerZone = useMemo(() => browserTimeZone(), [])

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
    const held = scopedMeetings.filter(meeting => meeting.status === 'completed').length
    const cancelled = scopedMeetings.filter(meeting => meeting.status === 'cancelled' || meeting.status === 'declined').length
    return { all: scopedMeetings.length, incoming, outgoing, pending, confirmed, held, cancelled }
  }, [scopedMeetings, user?.id])

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all',       label: t('meetingsPage.tabs.all'),       count: counts.all },
    { id: 'incoming',  label: t('meetingsPage.tabs.incoming'),  count: counts.incoming },
    { id: 'outgoing',  label: t('meetingsPage.tabs.outgoing'),  count: counts.outgoing },
    { id: 'pending',   label: t('meetingsPage.tabs.pending'),   count: counts.pending },
    { id: 'confirmed', label: t('meetingsPage.tabs.confirmed'), count: counts.confirmed },
    { id: 'held',      label: t('meetingsPage.tabs.held'),      count: counts.held },
    { id: 'cancelled', label: t('meetingsPage.tabs.closed'),    count: counts.cancelled },
  ]

  const visibleMeetings = useMemo(() => {
    return scopedMeetings
      .filter(meeting => {
        if (activeTab === 'incoming') return meeting.ownerId === user?.id
        if (activeTab === 'outgoing') return meeting.requesterId === user?.id
        if (activeTab === 'pending') return meeting.status === 'pending' || meeting.status === 'time_proposed'
        if (activeTab === 'confirmed') return meeting.status === 'confirmed'
        if (activeTab === 'held') return meeting.status === 'completed'
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
      setError(err instanceof Error ? err.message : t('meetingsPage.actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  const openChat = (meeting: Meeting) => runAction(meeting.id, async () => {
    const { data } = await api.get<{ success: boolean; data: { id?: string; _id?: string } }>(`/conversations/by-meeting/${meeting.id}`)
    navigate(`/messages/${data.data.id ?? data.data._id}`)
  })

  const confirmPartnerFound = async () => {
    if (!partnerFoundFor) return
    setPartnerFoundBusy(true)
    setPartnerFoundError(null)
    try {
      await usePostStore.getState().markPartnerFound(partnerFoundFor.postId)
      // The server also closed the post's unanswered requests; reload to show both changes.
      await fetchByUser()
      setPartnerFoundFor(null)
    } catch (err) {
      setPartnerFoundError(err instanceof Error ? err.message : t('meetingsPage.actionFailed'))
    } finally {
      setPartnerFoundBusy(false)
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

        {requestSentTo && (
          <div role="status" className="mt-8 flex items-start gap-3 rounded-2xl border border-[#8AC6D0] bg-[#E8F4F7] px-5 py-4 text-sm font-bold text-[var(--primary)]">
            <Check size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{t('meetingsPage.requestSent', { name: requestSentTo })}</span>
          </div>
        )}

        <div className="mt-11 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <FilterTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            <p className="text-sm font-semibold text-[var(--muted)]">{t('meetingsPage.tabsHelp')}</p>
          </div>

          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.41fr)]">
            <MeetingList
              meetings={visibleMeetings}
              userId={user?.id ?? ''}
              busyId={busyId}
              viewerZone={viewerZone}
              sortValue={sortMode}
              onSortChange={setSortMode}
              onAccept={meeting => runAction(meeting.id, () => accept(meeting.id))}
              onConfirm={(meeting, slot) => runAction(meeting.id, () => confirm(meeting.id, slot))}
              onDecline={(meeting, reason) => runAction(meeting.id, () => decline(meeting.id, reason))}
              onCancel={(meeting, reason) => runAction(meeting.id, () => cancel(meeting.id, reason))}
              onComplete={meeting => runAction(meeting.id, () => complete(meeting.id))}
              onOpenChat={openChat}
              onProposeTimes={setProposeFor}
              onPartnerFound={meeting => { setPartnerFoundError(null); setPartnerFoundFor(meeting) }}
              onViewAll={() => setActiveTab('all')}
            />
            <aside>
              <WidgetArea meetings={scopedMeetings} />
            </aside>
          </div>
        </div>
      </section>

      {proposeFor && (
        <ProposeTimesModal
          ownerName={proposeFor.ownerName}
          onSubmit={slots => reschedule(proposeFor.id, slots)}
          onClose={() => setProposeFor(null)}
        />
      )}

      {partnerFoundFor && (
        <ConfirmDialog
          title={t('partnerFound.confirmTitle')}
          confirmLabel={partnerFoundBusy ? t('common.loading') : t('partnerFound.confirm')}
          cancelLabel={t('common.cancel')}
          onConfirm={confirmPartnerFound}
          onCancel={() => setPartnerFoundFor(null)}
          busy={partnerFoundBusy}
          error={partnerFoundError}
        >
          <p>{t('partnerFound.confirmBody', { title: partnerFoundFor.postTitle })}</p>
          <p>{t('partnerFound.confirmUndo')}</p>
        </ConfirmDialog>
      )}
    </main>
  )
}

function Hero({ total }: { total: number }) {
  const { t } = useTranslation()
  return (
    <div>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)] shadow-[0_10px_30px_-24px_rgba(45,24,56,0.5)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          {t('meetingsPage.totalCount', { count: total })}
        </div>

        <h1 className="mt-5 font-headline text-6xl font-black leading-tight tracking-normal text-[var(--primary)] md:text-8xl">
          {t('meetingsPage.title')}
        </h1>

        <p className="mt-5 max-w-[650px] text-lg leading-8 text-[var(--muted)]">
          {t('meetingsPage.desc')}
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
            aria-pressed={active}
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
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
      <span>{t('meetingsPage.sortBy')}</span>
      <label className="relative">
        <select
          value={value}
          onChange={event => onChange(event.target.value as SortMode)}
          className="h-11 appearance-none rounded-full border border-[var(--border)] bg-white px-4 pr-9 text-sm font-black text-[var(--text)] outline-none transition hover:border-[var(--accent)] focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[var(--accent)]/25"
        >
          <option value="recent">{t('meetingsPage.sortRecent')}</option>
          <option value="oldest">{t('meetingsPage.sortOldest')}</option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
      </label>
    </div>
  )
}

interface RowHandlers {
  onAccept: (meeting: Meeting) => void
  onConfirm: (meeting: Meeting, slot: TimeSlot) => void
  onDecline: (meeting: Meeting, reason?: string) => void
  onCancel: (meeting: Meeting, reason?: string) => void
  onComplete: (meeting: Meeting) => void
  onOpenChat: (meeting: Meeting) => void
  onProposeTimes: (meeting: Meeting) => void
  onPartnerFound: (meeting: Meeting) => void
}

function MeetingList({
  meetings,
  userId,
  busyId,
  viewerZone,
  sortValue,
  onSortChange,
  onViewAll,
  ...handlers
}: {
  meetings: Meeting[]
  userId: string
  busyId: string | null
  viewerZone?: string
  sortValue: SortMode
  onSortChange: (value: SortMode) => void
  onViewAll: () => void
} & RowHandlers) {
  const { t } = useTranslation()
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
            viewerZone={viewerZone}
            {...handlers}
          />
        ))
      ) : (
        <div className="px-7 py-16 text-center text-base font-bold text-[var(--muted)]">
          {t('meetingsPage.noMatch')}
        </div>
      )}

      <div className="flex h-[76px] items-center justify-center border-t border-[var(--border)]">
        <button onClick={onViewAll} className="text-sm font-black text-[var(--primary)] transition hover:text-[var(--accent-strong)]">
          {t('meetingsPage.viewAll')}
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
  viewerZone,
  onAccept,
  onConfirm,
  onDecline,
  onCancel,
  onComplete,
  onOpenChat,
  onProposeTimes,
  onPartnerFound,
}: {
  meeting: Meeting
  userId: string
  busy: boolean
  isLast: boolean
  viewerZone?: string
} & RowHandlers) {
  const [confirmMode, setConfirmMode] = useState<'decline' | 'cancel' | null>(null)
  const [reason, setReason] = useState('')
  const { t, i18n } = useTranslation()

  const role = meetingRole(meeting, userId)
  const isOwner = role === 'owner'
  const partner = isOwner ? meeting.requesterName : meeting.ownerName
  const partnerEmail = isOwner ? meeting.requesterEmail : meeting.ownerEmail
  const status = meeting.status
  const style = MEETING_STATUS_STYLE[status]
  const StatusIcon = style.icon
  const chooseSlot = status === 'time_proposed' && isOwner && meeting.proposedSlots.length > 0
  const confirmed = meeting.confirmedSlot ? describeSlot(meeting.confirmedSlot, i18n.language, viewerZone) : null
  const postClosed = meeting.postStatus === 'partner_found'
  const canMarkPartnerFound = !!meeting.postStatus && CLOSABLE_POST_STATUSES.includes(meeting.postStatus)
  const hintKey = status === 'completed' && isOwner && postClosed
    ? 'meetingsPage.hint.completed.ownerPartnerFound'
    : `meetingsPage.hint.${status}.${role}`

  const handleConfirm = () => {
    const trimmed = reason.trim() || undefined
    if (confirmMode === 'decline') onDecline(meeting, trimmed)
    else onCancel(meeting, trimmed)
    setConfirmMode(null)
    setReason('')
  }

  const handleAbort = () => { setConfirmMode(null); setReason('') }

  return (
    <article
      className={`grid min-h-[128px] grid-cols-[52px_minmax(0,1fr)_minmax(160px,0.2fr)_minmax(220px,0.24fr)] items-center gap-5 px-7 py-5 transition hover:bg-[#F3F4F6] max-lg:grid-cols-[46px_minmax(0,1fr)] ${
        isLast ? '' : 'border-b border-[var(--border)]'
      }`}
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black tracking-[0.12em] text-[var(--accent)]">
        {initials(partner)}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="truncate font-headline text-lg font-black">
            <Link
              to={postDetail(meeting.postId)}
              className="rounded-sm text-[var(--text)] transition hover:text-[var(--accent-strong)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              {meeting.postTitle}
            </Link>
          </h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${style.className}`}>
            <StatusIcon size={13} aria-hidden="true" />
            {t(`meetings.status.${status}`)}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-[var(--muted)]">
          {t(`meetingsPage.direction.${isOwner ? 'incoming' : 'outgoing'}`, { name: partner })}
          {partnerEmail && (
            <>
              <span className="px-1.5 text-[#D5DAE0]">•</span> {partnerEmail}
            </>
          )}
        </p>
        <p className="mt-2 text-sm font-bold text-[var(--primary)]">
          {t(hintKey, { name: partner })}
        </p>
        {status === 'declined' && meeting.declineReason && (
          <p className="mt-2 text-xs font-semibold text-[#9B1C1C]">
            {t('meetingsPage.reason', { reason: meeting.declineReason })}
          </p>
        )}
        {status === 'cancelled' && meeting.cancelReason && (
          <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
            {t('meetingsPage.reason', { reason: meeting.cancelReason })}
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm font-bold text-[var(--muted)] max-lg:col-start-2">
        {confirmed ? (
          <>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--primary)]" aria-hidden="true" />
              {confirmed.dateLabel}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--primary)]" aria-hidden="true" />
              {confirmed.timeLabel}
              {confirmed.zoneLabel && <span className="font-semibold">· {confirmed.zoneLabel}</span>}
            </div>
            {confirmed.local && (
              <div className="text-xs font-semibold">{t('meetingSlots.yourTime', { date: confirmed.local.dateLabel, time: confirmed.local.timeLabel })}</div>
            )}
          </>
        ) : meeting.proposedSlots.length > 0 ? (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--primary)]" aria-hidden="true" />
            {t('meetingsPage.proposedSlots', { count: meeting.proposedSlots.length })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--primary)]" aria-hidden="true" />
            {new Date(meeting.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 max-lg:col-span-2 max-lg:justify-start">
        {confirmMode ? (
          <div className="flex w-full flex-col gap-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t(`meetingsPage.reasonPrompt.${confirmMode}`)}
              aria-label={t(`meetingsPage.reasonPrompt.${confirmMode}`)}
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] outline-none placeholder:text-[#9CA3AF] focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[var(--accent)]/25"
            />
            <div className="flex justify-end gap-2">
              <ActionButton disabled={false} onClick={handleAbort} tone="quiet">
                {t('meetingsPage.goBack')}
              </ActionButton>
              <ActionButton disabled={busy} onClick={handleConfirm} tone="primary">
                {confirmMode === 'decline' ? t('meetingsPage.confirmDecline') : t('meetingsPage.confirmCancel')}
              </ActionButton>
            </div>
          </div>
        ) : (
          <>
            {status === 'pending' && isOwner && (
              <>
                <ActionButton disabled={busy} onClick={() => onAccept(meeting)} tone="primary">
                  <Check size={14} aria-hidden="true" />
                  {t('meetings.accept')}
                </ActionButton>
                <ActionButton disabled={busy} onClick={() => setConfirmMode('decline')} tone="quiet">
                  {t('meetingsPage.decline')}
                </ActionButton>
              </>
            )}

            {chooseSlot && (
              <div className="flex w-full flex-col items-end gap-2 max-lg:items-start">
                <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                  {t('meetingsPage.chooseProposedSlot')}
                </div>
                <div className="flex flex-wrap justify-end gap-2 max-lg:justify-start">
                  {meeting.proposedSlots.map(slotOption => {
                    const view = describeSlot(slotOption, i18n.language, viewerZone)
                    return (
                      <button
                        key={`${slotOption.date}-${slotOption.time}`}
                        type="button"
                        disabled={busy}
                        onClick={() => onConfirm(meeting, slotOption)}
                        className="flex flex-col items-start rounded-2xl bg-[var(--primary)] px-4 py-2 text-left text-white transition hover:bg-[#24162B] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-black">
                          <Check size={13} aria-hidden="true" />
                          {view.dateLabel} · {view.timeLabel}
                        </span>
                        {view.zoneLabel && <span className="text-[11px] font-semibold text-white/80">{view.zoneLabel}</span>}
                        {view.local && (
                          <span className="text-[11px] font-semibold text-[var(--accent)]">
                            {t('meetingSlots.yourTime', { date: view.local.dateLabel, time: view.local.timeLabel })}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <ActionButton disabled={busy} onClick={() => setConfirmMode('decline')} tone="quiet">
                  {t('meetingsPage.decline')}
                </ActionButton>
              </div>
            )}

            {CHAT_OPEN_STATUSES.includes(status) && (
              <ActionButton disabled={busy} onClick={() => onOpenChat(meeting)} tone="chat">
                <MessageSquare size={14} aria-hidden="true" />
                {t('meetingsPage.openChat')}
              </ActionButton>
            )}

            {(status === 'time_proposed' || status === 'confirmed') && !isOwner && (
              <ActionButton disabled={busy} onClick={() => onProposeTimes(meeting)} tone="quiet">
                <CalendarPlus size={14} aria-hidden="true" />
                {t('meetingsPage.proposeNewTimes')}
              </ActionButton>
            )}

            {status === 'confirmed' && (
              <ActionButton disabled={busy} onClick={() => onComplete(meeting)} tone="primary" title={t('meetingsPage.markHeldHelp')}>
                <Check size={14} aria-hidden="true" />
                {t('meetingsPage.markHeld')}
              </ActionButton>
            )}

            {(status === 'pending' || status === 'time_proposed') && !isOwner && (
              <ActionButton disabled={busy} onClick={() => setConfirmMode('cancel')} tone="quiet">
                {t('meetingsPage.cancelRequest')}
              </ActionButton>
            )}

            {status === 'confirmed' && (
              <ActionButton disabled={busy} onClick={() => setConfirmMode('cancel')} tone="quiet">
                {t('meetingsPage.cancel')}
              </ActionButton>
            )}

            {status === 'completed' && (
              <MeetingSummaryButton meetingId={meeting.id} postTitle={meeting.postTitle} />
            )}

            {status === 'completed' && isOwner && (
              canMarkPartnerFound ? (
                <ActionButton disabled={busy} onClick={() => onPartnerFound(meeting)} tone="quiet">
                  <Flag size={14} aria-hidden="true" />
                  {t('partnerFound.button')}
                </ActionButton>
              ) : (
                <Link to={postDetail(meeting.postId)} className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)] underline">
                  {t('meetingsPage.goToPost')}
                </Link>
              )
            )}

            {(status === 'cancelled' || status === 'declined') && (
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                {t('meetingsPage.noActions')}
              </span>
            )}
          </>
        )}
      </div>
    </article>
  )
}

interface AiSummaryData {
  topics: string[]
  nextSteps: string[]
  openQuestions: string[]
  generatedAt: string
}

function MeetingSummaryButton({ meetingId, postTitle }: { meetingId: string; postTitle: string }) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<AiSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { t, i18n } = useTranslation()

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<{ success: boolean; data: AiSummaryData }>(
        `/ai/meeting-summary/${meetingId}`
      )
      setSummary(data.data)
      setOpen(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  return (
    <div>
      <button
        type="button"
        onClick={summary ? () => setOpen(o => !o) : generate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F4F7] px-3 py-1.5 text-xs font-black text-hai-teal transition hover:bg-hai-teal hover:text-white disabled:opacity-50"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>
          auto_awesome
        </span>
        {loading ? t('common.loading') : t('meetings.aiSummary')}
      </button>

      {error && <p className="mt-1 text-[10px] font-semibold text-red-500">{error}</p>}

      {summary && open && (
        <div className="mt-3 rounded-xl border border-[#D5DAE0] bg-[#F8FBFC] p-4 text-xs">
          {summary.topics.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 font-black uppercase tracking-wide text-hai-plum">{t('meetings.summaryTopics')}</p>
              <ul className="space-y-1">
                {summary.topics.map((topic, i) => <li key={i} className="flex gap-2 font-semibold text-[#374151]"><span className="text-hai-teal">•</span>{topic}</li>)}
              </ul>
            </div>
          )}
          {summary.nextSteps.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 font-black uppercase tracking-wide text-hai-plum">{t('meetings.summaryNextSteps')}</p>
              <ul className="space-y-1">
                {summary.nextSteps.map((s, i) => <li key={i} className="flex gap-2 font-semibold text-[#374151]"><span className="text-green-600">→</span>{s}</li>)}
              </ul>
            </div>
          )}
          {summary.openQuestions.length > 0 && (
            <div>
              <p className="mb-1.5 font-black uppercase tracking-wide text-hai-plum">{t('meetings.summaryOpenQuestions')}</p>
              <ul className="space-y-1">
                {summary.openQuestions.map((q, i) => <li key={i} className="flex gap-2 font-semibold text-[#374151]"><span className="text-amber-600">?</span>{q}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] text-[#6B7280]">
              {t('meetings.summaryGenerated')} {new Date(summary.generatedAt).toLocaleDateString(i18n.language)}
            </p>
            <button
              type="button"
              onClick={() => void exportSummaryToPdf({ postTitle, ...summary })}
              className="inline-flex items-center gap-1 text-[10px] font-black text-[#6B7280] hover:text-hai-teal"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xs">picture_as_pdf</span>
              {t('meetings.exportPdf')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  children,
  disabled,
  onClick,
  tone,
  title,
}: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
  tone: 'primary' | 'quiet' | 'chat'
  title?: string
}) {
  const cls = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[#24162B]',
    quiet:   'border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--primary)]',
    chat:    'bg-[#E8F4F7] text-[var(--primary)] border border-[var(--accent)] hover:bg-[var(--success-bg)]',
  }[tone]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  )
}

function WidgetArea({ meetings }: { meetings: Meeting[] }) {
  const { t } = useTranslation()
  const [calendarOpen, setCalendarOpen] = useState(true)
  const [overviewOpen, setOverviewOpen] = useState(true)

  return (
    <div className="relative">
      <div className="mb-6 flex items-start justify-end gap-4 pr-2">
        <IconButton icon={<Calendar size={20} />} label={t('meetingsPage.openCalendar')} onClick={() => setCalendarOpen(open => !open)} active={calendarOpen} />
        <IconButton icon={<PieChart size={20} />} label={t('meetingsPage.openOverview')} onClick={() => setOverviewOpen(open => !open)} active={overviewOpen} />
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
      aria-pressed={active}
      title={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full border text-[var(--primary)] shadow-[0_18px_45px_-32px_rgba(45,24,56,0.72)] transition hover:border-[var(--accent)] hover:bg-[var(--success-bg)] ${
        active ? 'border-[var(--accent)] bg-[var(--success-bg)]' : 'border-[var(--border)] bg-white'
      }`}
    >
      {icon}
    </button>
  )
}

/** Sunday-first narrow weekday names in the interface language. */
function weekdayInitials(locale: string) {
  // 4 January 2026 was a Sunday.
  return Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + day))),
  )
}

function CalendarPanel({ meetings, onClose }: { meetings: Meeting[]; onClose: () => void }) {
  const { t, i18n } = useTranslation()
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
          {monthCursor.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1.5">
          <button aria-label={t('meetingsPage.previousMonth')} onClick={() => setMonthCursor(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <ChevronLeft size={16} />
          </button>
          <button aria-label={t('meetingsPage.nextMonth')} onClick={() => setMonthCursor(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <ChevronRight size={16} />
          </button>
          <button aria-label={t('common.close')} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {weekdayInitials(i18n.language).map((day, index) => (
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
  const { t } = useTranslation()
  const [range, setRange] = useState('month')
  const total = meetings.length
  const count = (...statuses: MeetingStatus[]) => meetings.filter(m => statuses.includes(m.status)).length
  const legend = [
    { label: t('meetings.status.pending'),       value: count('pending'),               color: '#E0A100' },
    { label: t('meetings.status.time_proposed'), value: count('time_proposed'),         color: '#3B63D1' },
    { label: t('meetings.status.confirmed'),     value: count('confirmed'),             color: '#2E9E5B' },
    { label: t('meetings.status.completed'),     value: count('completed'),             color: '#36213E' },
    { label: t('meetingsPage.tabs.closed'),      value: count('cancelled', 'declined'), color: '#9CA3AF' },
  ]

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_28px_70px_-54px_rgba(45,24,56,0.6)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-headline text-lg font-black text-[var(--primary)]">{t('meetingsPage.overview')}</h2>
        <div className="flex items-center gap-2">
          <label className="relative">
            <span className="sr-only">{t('meetingsPage.overview')}</span>
            <select
              value={range}
              onChange={event => setRange(event.target.value)}
              className="h-9 appearance-none rounded-full border border-[var(--border)] bg-white px-3 pr-8 text-xs font-black text-[var(--text)] outline-none focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[var(--accent)]/25"
            >
              <option value="month">{t('meetingsPage.thisMonth')}</option>
              <option value="all">{t('meetingsPage.allTime')}</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </label>
          <button aria-label={t('common.close')} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#EEF0F3]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <DonutChart total={total} legend={legend} totalLabel={t('meetingsPage.total')} />
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

function DonutChart({ total, legend, totalLabel }: { total: number; legend: { value: number; color: string }[]; totalLabel: string }) {
  const circumference = 421
  let offset = 0

  return (
    <div className="relative h-[178px] w-[178px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
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
        <span className="mt-1 text-sm font-black text-[var(--muted)]">{totalLabel}</span>
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

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function percent(value: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
