import type { TimeSlot } from '../types/meeting.types'

/**
 * Meeting times are proposed as a wall-clock date and time plus the IANA zone
 * of the person proposing them. Collaborators sit in different countries, so a
 * bare "14:00" is ambiguous — these helpers make every slot explicit and show
 * each viewer the time in their own zone as well.
 */

export const MIN_PROPOSED_SLOTS = 1
export const MAX_PROPOSED_SLOTS = 5
/** Hours on a 24-hour clock; AM/PM was misread in the usability survey. */
export const SLOT_HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
/** Quarter-hour steps: every minute is noise, and :00 must always be one click away. */
export const SLOT_MINUTES = ['00', '15', '30', '45']

export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

/** YYYY-MM-DD for the local calendar day — what <input type="date"> expects. */
export function localDateInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function zoneParts(instant: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '00'
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

function zoneOffsetMs(instantMs: number, zone: string): number {
  const p = zoneParts(new Date(instantMs), zone)
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instantMs
}

/** The instant at which the wall clock in `zone` reads `date` `time`. Mirrors backend/utils/timeZone.ts. */
export function zonedTimeToUtc(date: string, time: string, zone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const firstGuess = wallClockAsUtc - zoneOffsetMs(wallClockAsUtc, zone)
  return new Date(wallClockAsUtc - zoneOffsetMs(firstGuess, zone))
}

export function isSlotComplete(slot: TimeSlot): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(slot.date) && /^\d{2}:\d{2}$/.test(slot.time)
}

/** "Wed 15 Jul 2026"-style label for a calendar date, independent of any zone. */
export function formatSlotDate(date: string, locale: string, withYear = true): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export interface SlotView {
  dateLabel: string
  /** Always HH:MM on a 24-hour clock. */
  timeLabel: string
  /** e.g. "Istanbul (GMT+3)"; absent for slots saved before zones were recorded. */
  zoneLabel?: string
  /** The same moment in the viewer's zone, when that differs from the proposer's. */
  local?: { date: string; dateLabel: string; timeLabel: string }
}

export function describeSlot(slot: TimeSlot, locale: string, viewerZone?: string): SlotView {
  const view: SlotView = { dateLabel: formatSlotDate(slot.date, locale), timeLabel: slot.time }
  if (!slot.timezone) return view

  let instant: Date
  try {
    instant = zonedTimeToUtc(slot.date, slot.time, slot.timezone)
    const offset = new Intl.DateTimeFormat(locale, { timeZone: slot.timezone, timeZoneName: 'shortOffset' })
      .formatToParts(instant)
      .find(part => part.type === 'timeZoneName')?.value
    const city = slot.timezone.split('/').pop()?.replace(/_/g, ' ') ?? slot.timezone
    view.zoneLabel = offset ? `${city} (${offset})` : city
  } catch {
    return view // unknown zone name: show the slot as entered
  }

  if (viewerZone && viewerZone !== slot.timezone) {
    try {
      const p = zoneParts(instant, viewerZone)
      const date = `${p.year}-${p.month}-${p.day}`
      const timeLabel = `${p.hour}:${p.minute}`
      if (date !== slot.date || timeLabel !== slot.time) {
        view.local = { date, dateLabel: formatSlotDate(date, locale, false), timeLabel }
      }
    } catch {
      // viewer zone unknown to this browser: skip the conversion
    }
  }
  return view
}
