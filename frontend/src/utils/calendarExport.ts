import type { Meeting } from '../types/meeting.types'

function toICSDate(date: string, time: string) {
  // date: YYYY-MM-DD, time: HH:MM → YYYYMMDDTHHMMSS
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function addOneHour(date: string, time: string) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(`${date}T${time}:00`)
  end.setHours(h + 1, m)
  const pad = (n: number) => String(n).padStart(2, '0')
  const endDate = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`
  const endTime = `${pad(end.getHours())}${pad(end.getMinutes())}00`
  return `${endDate}T${endTime}`
}

export function downloadICS(meeting: Meeting) {
  if (!meeting.confirmedSlot) return
  const { date, time } = meeting.confirmedSlot
  const dtStart = toICSDate(date, time)
  const dtEnd   = addOneHour(date, time)
  // \W ile tire, iki nokta ve nokta temizlenir. Bu karakterleri köşeli parantezli
  // karakter sınıfıyla yazmayın: Tailwind içerik tarayıcısı o metni
  // arbitrary-property sınıfı sanıp geçersiz CSS üretiyor (build'de css-syntax-error uyarısı).
  const now     = new Date().toISOString().replace(/\W/g, '').slice(0, 15) + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HealthAI//Co-Creation Platform//EN',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@healthai-platform`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:HealthAI Meeting — ${meeting.postTitle}`,
    `DESCRIPTION:Collaboration meeting with ${meeting.ownerName} and ${meeting.requesterName}\\nPost: ${meeting.postTitle}`,
    'LOCATION:Online',
    ...(meeting.ownerEmail    ? [`ORGANIZER;CN=${meeting.ownerName}:mailto:${meeting.ownerEmail}`]     : []),
    ...(meeting.requesterEmail ? [`ATTENDEE;CN=${meeting.requesterName}:mailto:${meeting.requesterEmail}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `healthai-meeting-${meeting.id}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(meeting: Meeting): string {
  if (!meeting.confirmedSlot) return '#'
  const { date, time } = meeting.confirmedSlot
  const start = toICSDate(date, time)
  const end   = addOneHour(date, time)
  const p = new URLSearchParams({
    action:   'TEMPLATE',
    text:     `HealthAI Meeting — ${meeting.postTitle}`,
    dates:    `${start}/${end}`,
    details:  `Collaboration meeting with ${meeting.ownerName} and ${meeting.requesterName}`,
    location: 'Online',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function outlookCalendarUrl(meeting: Meeting): string {
  if (!meeting.confirmedSlot) return '#'
  const { date, time } = meeting.confirmedSlot
  const startISO = `${date}T${time}:00`
  const endDate  = new Date(`${date}T${time}:00`)
  endDate.setHours(endDate.getHours() + 1)
  const endISO = endDate.toISOString().slice(0, 19)
  const p = new URLSearchParams({
    subject:  `HealthAI Meeting — ${meeting.postTitle}`,
    startdt:  startISO,
    enddt:    endISO,
    body:     `Collaboration meeting with ${meeting.ownerName} and ${meeting.requesterName}`,
    location: 'Online',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`
}
