import { Ban, CalendarCheck, CalendarClock, CheckCheck, Hourglass, XCircle, type LucideIcon } from 'lucide-react'
import type { Meeting, MeetingStatus } from '../types/meeting.types'

/**
 * One distinct colour and icon per meeting status. Survey participants could
 * not tell "confirmed" from "completed" because both were pale teal; colour
 * alone is also not enough for colour-blind members, hence the icons.
 * All pairs meet WCAG AA contrast for small bold text.
 */
export const MEETING_STATUS_STYLE: Record<MeetingStatus, { className: string; icon: LucideIcon }> = {
  pending:       { className: 'bg-[#FFF4D6] text-[#7A4B00]', icon: Hourglass },
  time_proposed: { className: 'bg-[#E4ECFF] text-[#1E3A8A]', icon: CalendarClock },
  confirmed:     { className: 'bg-[#DCF5E6] text-[#14532D]', icon: CalendarCheck },
  completed:     { className: 'bg-[#36213E] text-white', icon: CheckCheck },
  declined:      { className: 'bg-[#FDE8E8] text-[#9B1C1C]', icon: XCircle },
  cancelled:     { className: 'bg-[#EEF0F3] text-[#4B5563]', icon: Ban },
}

/** Statuses in which the two sides can talk in the meeting's chat. */
export const CHAT_OPEN_STATUSES: MeetingStatus[] = ['time_proposed', 'confirmed', 'completed']

export type MeetingRole = 'owner' | 'requester'

export function meetingRole(meeting: Pick<Meeting, 'ownerId'>, userId: string): MeetingRole {
  return meeting.ownerId === userId ? 'owner' : 'requester'
}
