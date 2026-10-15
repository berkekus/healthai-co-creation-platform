import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Meeting, TimeSlot } from '../../types/meeting.types'
import { formatSlotDate, zonedTimeToUtc } from '../../utils/timeSlots'

/** How a meeting shows on a day: fixed (scheduled or held) or one of the times still on offer. */
export type DayMark = 'confirmed' | 'proposed'

/** YYYY-MM-DD of a moment in `zone` (the browser's zone when absent). */
function isoDateIn(instant: Date, zone?: string): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant)
}

/**
 * The calendar day a slot falls on for the viewer. A slot proposed in another
 * zone can land on a different date here (late evening in Lisbon is past
 * midnight in Istanbul); slots saved before zones were recorded keep their date.
 */
export function slotDayFor(slot: TimeSlot, viewerZone?: string): string {
  if (!slot.timezone) return slot.date
  return isoDateIn(zonedTimeToUtc(slot.date, slot.time, slot.timezone), viewerZone)
}

/**
 * The days a meeting occupies. Declined and cancelled meetings are not on the
 * calendar: marking them made it look busy with meetings that will not happen.
 */
export function meetingDays(meeting: Meeting, viewerZone?: string): { day: string; mark: DayMark }[] {
  if (meeting.status === 'confirmed' || meeting.status === 'completed') {
    return meeting.confirmedSlot ? [{ day: slotDayFor(meeting.confirmedSlot, viewerZone), mark: 'confirmed' }] : []
  }
  if (meeting.status === 'pending' || meeting.status === 'time_proposed') {
    return meeting.proposedSlots.map(slot => ({ day: slotDayFor(slot, viewerZone), mark: 'proposed' as const }))
  }
  return []
}

export function meetingIsOnDay(meeting: Meeting, day: string, viewerZone?: string): boolean {
  return meetingDays(meeting, viewerZone).some(entry => entry.day === day)
}

/** Per day: how many meetings are fixed, and how many only have a proposed time there. */
export function marksByDay(meetings: Meeting[], viewerZone?: string): Map<string, { confirmed: number; proposed: number }> {
  const byDay = new Map<string, { confirmed: number; proposed: number }>()
  for (const meeting of meetings) {
    // A request proposing two times on one day is still one meeting on that day.
    const seen = new Set<string>()
    for (const { day, mark } of meetingDays(meeting, viewerZone)) {
      if (seen.has(day)) continue
      seen.add(day)
      const entry = byDay.get(day) ?? { confirmed: 0, proposed: 0 }
      entry[mark] += 1
      byDay.set(day, entry)
    }
  }
  return byDay
}

/** Monday-first narrow weekday names: every language the site offers starts its week on Monday. */
function weekdayInitials(locale: string) {
  // 5 January 2026 was a Monday.
  return Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 5 + day))),
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

interface Props {
  meetings: Meeting[]
  viewerZone?: string
  /** YYYY-MM-DD the list is narrowed to, if any. */
  selectedDay: string | null
  onSelectDay: (day: string | null) => void
  onClose: () => void
}

export default function MeetingCalendar({ meetings, viewerZone, selectedDay, onSelectDay, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // getDay() counts from Sunday; shift so the grid starts on Monday.
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const marks = marksByDay(meetings, viewerZone)
  const today = isoDateIn(new Date(), viewerZone)

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_28px_70px_-54px_rgba(45,24,56,0.6)]">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">{t('meetingsPage.calendarTitle')}</p>
        <button aria-label={t('common.close')} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-surface-muted">
          <X size={16} />
        </button>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-headline text-lg font-black text-[var(--primary)]">
          {monthCursor.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1.5">
          <button aria-label={t('meetingsPage.previousMonth')} onClick={() => setMonthCursor(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-surface-muted">
            <ChevronLeft size={16} />
          </button>
          <button aria-label={t('meetingsPage.nextMonth')} onClick={() => setMonthCursor(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-surface-muted">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm font-semibold text-[var(--muted)]">{t('meetingsPage.calendarHelp')}</p>

      <div className="grid grid-cols-7 gap-y-2">
        {weekdayInitials(i18n.language).map((day, index) => (
          <div key={`${day}-${index}`} aria-hidden="true" className="text-center text-xs font-black uppercase text-ink-muted">
            {day}
          </div>
        ))}
        {Array.from({ length: startOffset }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(dayNumber => {
          const day = `${year}-${pad(month + 1)}-${pad(dayNumber)}`
          const mark = marks.get(day)
          const count = mark ? mark.confirmed + mark.proposed : 0
          const selected = day === selectedDay
          const shape = mark?.confirmed
            ? 'bg-[var(--primary)] text-white'
            : mark?.proposed
              ? 'border-2 border-[var(--primary)] text-[var(--primary)]'
              : 'text-[var(--muted)]'
          const label = [
            formatSlotDate(day, i18n.language),
            count ? t('meetingsPage.dayMeetings', { count }) : t('meetingsPage.dayNoMeetings'),
            day === today ? t('meetingsPage.today') : '',
          ].filter(Boolean).join(' · ')
          return (
            <div key={day} className="flex h-10 items-center justify-center">
              <button
                type="button"
                disabled={!count}
                onClick={() => onSelectDay(selected ? null : day)}
                aria-pressed={count ? selected : undefined}
                aria-label={label}
                title={label}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition disabled:cursor-default ${shape} ${
                  selected ? 'ring-2 ring-[var(--accent-strong)] ring-offset-2' : ''
                } ${count ? 'hover:ring-2 hover:ring-[var(--accent)]' : ''}`}
              >
                {dayNumber}
                {day === today && <span aria-hidden="true" className={`absolute bottom-1 h-1 w-1 rounded-full ${mark?.confirmed ? 'bg-white' : 'bg-[var(--accent-strong)]'}`} />}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[var(--muted)]">
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-[var(--primary)]" />{t('meetingsPage.legendConfirmed')}</span>
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-[var(--primary)]" />{t('meetingsPage.legendProposed')}</span>
      </div>
    </section>
  )
}
