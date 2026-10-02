import { Ban, CalendarCheck, CalendarClock, CheckCheck, Hourglass, XCircle, type LucideIcon } from 'lucide-react'
import type { Meeting, MeetingStatus } from '../types/meeting.types'

/**
 * One distinct colour and icon per meeting status. Survey participants could
 * not tell "confirmed" from "completed" because both were pale teal; colour
 * alone is also not enough for colour-blind members, hence the icons.
 * All pairs meet WCAG AA contrast for small bold text.
 */
export const MEETING_STATUS_STYLE: Record<MeetingStatus, { className: string; icon: LucideIcon }> = {
  pending:       { className: 'bg-tone-amber-soft text-tone-amber', icon: Hourglass },
  time_proposed: { className: 'bg-tone-blue-soft text-tone-blue', icon: CalendarClock },
  confirmed:     { className: 'bg-tone-green-soft text-tone-green', icon: CalendarCheck },
  completed:     { className: 'bg-hai-plum text-white', icon: CheckCheck },
  declined:      { className: 'bg-tone-red-soft text-tone-red', icon: XCircle },
  cancelled:     { className: 'bg-tone-gray-soft text-tone-gray', icon: Ban },
}

/** Statuses in which the two sides can talk in the meeting's chat. */
export const CHAT_OPEN_STATUSES: MeetingStatus[] = ['time_proposed', 'confirmed', 'completed']

export type MeetingRole = 'owner' | 'requester'

export function meetingRole(meeting: Pick<Meeting, 'ownerId'>, userId: string): MeetingRole {
  return meeting.ownerId === userId ? 'owner' : 'requester'
}
