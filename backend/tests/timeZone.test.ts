import { describe, it, expect } from 'vitest'
import { isValidTimeZone, zonedTimeToUtc } from '../utils/timeZone'

describe('zonedTimeToUtc', () => {
  it.each([
    // Istanbul has been UTC+3 all year since 2016.
    ['2026-01-15', '12:00', 'Europe/Istanbul', '2026-01-15T09:00:00.000Z'],
    // Lisbon: WET (UTC+0) in winter, WEST (UTC+1) in summer.
    ['2026-01-15', '12:00', 'Europe/Lisbon', '2026-01-15T12:00:00.000Z'],
    ['2026-07-15', '12:00', 'Europe/Lisbon', '2026-07-15T11:00:00.000Z'],
    // New York: EST (UTC-5) in winter, EDT (UTC-4) in summer; crosses midnight UTC.
    ['2026-01-15', '21:30', 'America/New_York', '2026-01-16T02:30:00.000Z'],
    ['2026-07-15', '12:00', 'America/New_York', '2026-07-15T16:00:00.000Z'],
  ])('reads %s %s in %s as %s', (date, time, zone, expected) => {
    expect(zonedTimeToUtc(date, time, zone).toISOString()).toBe(expected)
  })
})

describe('isValidTimeZone', () => {
  it('accepts IANA zone names', () => {
    expect(isValidTimeZone('Europe/Amsterdam')).toBe(true)
    expect(isValidTimeZone('UTC')).toBe(true)
  })

  it('rejects unknown or malformed zone names', () => {
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
    expect(isValidTimeZone(42)).toBe(false)
  })
})
