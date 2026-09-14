import { describe, it, expect } from 'vitest'
import { describeSlot, localDateInputValue, zonedTimeToUtc } from '../utils/timeSlots'

describe('localDateInputValue', () => {
  it('uses the local calendar day, not the UTC one', () => {
    // 23:30 local on 5 January is already 6 January in UTC for zones east of UTC.
    expect(localDateInputValue(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('zonedTimeToUtc', () => {
  it.each([
    ['2026-01-15', '12:00', 'Europe/Istanbul', '2026-01-15T09:00:00.000Z'],
    ['2026-07-15', '12:00', 'Europe/Lisbon', '2026-07-15T11:00:00.000Z'],
    ['2026-01-15', '21:30', 'America/New_York', '2026-01-16T02:30:00.000Z'],
  ])('reads %s %s in %s as %s', (date, time, zone, expected) => {
    expect(zonedTimeToUtc(date, time, zone).toISOString()).toBe(expected)
  })
})

describe('describeSlot', () => {
  it('always shows the proposed time on a 24-hour clock', () => {
    expect(describeSlot({ date: '2026-07-15', time: '15:45' }, 'en-US').timeLabel).toBe('15:45')
  })

  it('names the zone a slot was proposed in', () => {
    const view = describeSlot({ date: '2026-07-15', time: '12:00', timezone: 'Europe/Istanbul' }, 'en-GB')
    expect(view.zoneLabel).toContain('Istanbul')
    expect(view.zoneLabel).toContain('GMT+3')
  })

  it("adds the viewer's own time when they are in another zone", () => {
    const view = describeSlot({ date: '2026-07-15', time: '12:00', timezone: 'Europe/Lisbon' }, 'en-GB', 'Europe/Istanbul')
    expect(view.local).toMatchObject({ date: '2026-07-15', timeLabel: '14:00' })
  })

  it("moves the viewer's date when the conversion crosses midnight", () => {
    const view = describeSlot({ date: '2026-01-15', time: '23:30', timezone: 'Europe/Lisbon' }, 'en-GB', 'Europe/Istanbul')
    expect(view.local).toMatchObject({ date: '2026-01-16', timeLabel: '02:30' })
  })

  it('adds nothing when the viewer shares the zone', () => {
    const view = describeSlot({ date: '2026-07-15', time: '12:00', timezone: 'Europe/Istanbul' }, 'en-GB', 'Europe/Istanbul')
    expect(view.local).toBeUndefined()
  })

  it('shows an older slot without a zone as it was entered', () => {
    const view = describeSlot({ date: '2026-07-15', time: '09:00' }, 'en-GB', 'Europe/Istanbul')
    expect(view.timeLabel).toBe('09:00')
    expect(view.zoneLabel).toBeUndefined()
    expect(view.local).toBeUndefined()
  })
})
