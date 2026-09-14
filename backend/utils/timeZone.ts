/**
 * Meeting slots are stored as a wall-clock date and time plus the IANA zone the
 * person proposing them was in. These helpers turn that back into an instant,
 * so "is this slot in the future?" does not depend on the server's own zone.
 */

export function isValidTimeZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || zone.length === 0) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

/** Milliseconds the zone is ahead of UTC at the given instant. */
function zoneOffsetMs(instantMs: number, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instantMs))
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value)
  const wallClockAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return wallClockAsUtc - instantMs
}

/** The instant at which the wall clock in `zone` reads `date` (YYYY-MM-DD) `time` (HH:MM). */
export function zonedTimeToUtc(date: string, time: string, zone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)

  // The offset depends on the instant, which depends on the offset. One
  // correction pass settles it everywhere except inside a DST gap, where the
  // wall-clock time does not exist and either neighbouring instant is fine.
  const firstGuess = wallClockAsUtc - zoneOffsetMs(wallClockAsUtc, zone)
  return new Date(wallClockAsUtc - zoneOffsetMs(firstGuess, zone))
}
