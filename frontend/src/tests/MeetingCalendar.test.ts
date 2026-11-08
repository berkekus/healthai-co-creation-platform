import { describe, expect, it } from 'vitest'
import { marksByDay, meetingDays, slotDayFor } from '../components/meetings/MeetingCalendar'
import type { Meeting, MeetingStatus } from '../types/meeting.types'

function meeting(status: MeetingStatus, extra: Partial<Meeting> = {}): Meeting {
  return {
    id: `m-${status}`, postId: 'p', postTitle: 'Post', requesterId: 'a', requesterName: 'A', ownerId: 'b', ownerName: 'B',
    status, message: '', ndaAccepted: true,
    proposedSlots: [{ date: '2030-03-14', time: '10:00' }, { date: '2030-03-15', time: '10:00' }],
    createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z',
    ...extra,
  }
}

describe('MeetingCalendar days', () => {
  it('moves a slot to the date it falls on in the viewer\'s zone', () => {
    // 23:30 in Lisbon is 01:30 the next day in Istanbul.
    const slot = { date: '2030-03-14', time: '23:30', timezone: 'Europe/Lisbon' }
    expect(slotDayFor(slot, 'Europe/Istanbul')).toBe('2030-03-15')
    expect(slotDayFor(slot, 'Europe/Lisbon')).toBe('2030-03-14')
  })

  it('keeps the date of a slot saved without a zone', () => {
    expect(slotDayFor({ date: '2030-03-14', time: '23:30' }, 'Asia/Tokyo')).toBe('2030-03-14')
  })

  it('shows a scheduled meeting on its confirmed day only', () => {
    const scheduled = meeting('confirmed', { confirmedSlot: { date: '2030-03-15', time: '10:00' } })
    expect(meetingDays(scheduled)).toEqual([{ day: '2030-03-15', mark: 'confirmed' }])
  })

  it('shows every time a request still offers, as proposed', () => {
    expect(meetingDays(meeting('pending')).map(d => d.mark)).toEqual(['proposed', 'proposed'])
  })

  it('leaves declined and cancelled meetings off the calendar', () => {
    expect(meetingDays(meeting('declined'))).toEqual([])
    expect(meetingDays(meeting('cancelled'))).toEqual([])
  })

  it('counts a request with two times on one day once for that day', () => {
    const twoSameDay = meeting('pending', {
      proposedSlots: [{ date: '2030-03-14', time: '10:00' }, { date: '2030-03-14', time: '15:00' }],
    })
    const scheduled = meeting('confirmed', { id: 'm2', confirmedSlot: { date: '2030-03-14', time: '12:00' } })

    expect(marksByDay([twoSameDay, scheduled]).get('2030-03-14')).toEqual({ confirmed: 1, proposed: 1 })
  })
})
