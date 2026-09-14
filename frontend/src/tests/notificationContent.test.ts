import { afterEach, describe, it, expect } from 'vitest'
import i18n from '../i18n'
import { getNotificationContent } from '../utils/notificationContent'
import { timeAgo } from '../utils/timeAgo'
import type { Notification, NotificationType } from '../types/common.types'

function notice(type: NotificationType, title: string, body: string, extra: Partial<Notification> = {}): Notification {
  return { id: 'n1', userId: 'u1', type, title, body, isRead: false, createdAt: '2026-09-01T10:00:00.000Z', ...extra }
}

const t = i18n.t.bind(i18n)

describe('getNotificationContent — notifications stored in Turkish before translations existed', () => {
  it.each<[string, NotificationType, string, string, { title: string; body: string }]>([
    ['an accepted request', 'meeting_accepted', 'Toplantı kabul edildi', 'Ana Costa toplantı talebinizi kabul etti. "Sepsis alerts"',
      { title: 'Meeting accepted', body: 'Ana Costa accepted your meeting request for "Sepsis alerts".' }],
    ['an accepted request awaiting a time', 'meeting_accepted', 'Toplantı kabul edildi', 'Ana Costa toplantı talebinizi kabul etti. Zaman dilimi onayını bekliyor. "Sepsis alerts"',
      { title: 'Meeting accepted', body: 'Ana Costa accepted your meeting request for "Sepsis alerts". A time slot is awaiting confirmation.' }],
    ['a declined request', 'meeting_declined', 'Toplantı reddedildi', 'Ana Costa toplantı talebinizi reddetti. "Sepsis alerts"',
      { title: 'Meeting request declined', body: 'Ana Costa declined your meeting request for "Sepsis alerts".' }],
    ['a cancelled request', 'meeting_cancelled', 'Toplantı iptal edildi', 'Mert Aydın toplantı talebini iptal etti. "Sepsis alerts"',
      { title: 'Meeting cancelled', body: 'Mert Aydın cancelled the meeting request for "Sepsis alerts".' }],
    ['a closed post', 'partner_found', 'İşbirliği tamamlandı', '"Sepsis alerts" için zaten bir işbirliği ortağı bulundu.',
      { title: 'Partner found', body: 'A collaboration partner has already been found for "Sepsis alerts".' }],
    ['new interest', 'interest_received', 'Yeni ilgi', 'Mert Aydın "Sepsis alerts" postunuza ilgi gösterdi.',
      { title: 'New interest', body: 'Mert Aydın is interested in your post "Sepsis alerts".' }],
    ['a deleted account', 'meeting_cancelled', 'Toplantı iptal edildi', 'Karşı taraf hesabını sildiği için "Sepsis alerts" görüşmesi iptal edildi.',
      { title: 'Meeting cancelled', body: 'The meeting for "Sepsis alerts" was cancelled because the other person\'s account was deleted.' }],
    ['a new message', 'new_message', 'Ana Costa yeni bir mesaj gönderdi', 'Can we talk on Thursday?',
      { title: 'New message from Ana Costa', body: 'Can we talk on Thursday?' }],
  ])('shows %s in English', (_label, type, title, body, expected) => {
    expect(getNotificationContent(notice(type, title, body), t)).toEqual(expected)
  })

  it('keeps a custom announcement exactly as it was written', () => {
    const custom = notice('account_activity', 'Planlı bakım', 'Platform pazar günü 02:00-03:00 arası kapalı olacak.')
    expect(getNotificationContent(custom, t)).toEqual({ title: 'Planlı bakım', body: 'Platform pazar günü 02:00-03:00 arası kapalı olacak.' })
  })
})

describe('getNotificationContent — comments', () => {
  it('describes a comment on your post', () => {
    const n = notice('new_comment', 'Yeni yorum', 'x', { contentKey: 'new_comment', metadata: { actorName: 'Mert Aydın', postTitle: 'Sepsis alerts' } })
    expect(getNotificationContent(n, t)).toEqual({
      title: 'New comment on your post',
      body: 'Mert Aydın commented on "Sepsis alerts".',
    })
  })

  it('describes a reply to your comment', () => {
    const n = notice('new_comment', 'Yorumunuza yanıt', 'x', { contentKey: 'comment_reply', metadata: { actorName: 'Ana Costa', postTitle: 'Sepsis alerts' } })
    expect(getNotificationContent(n, t).title).toBe('New reply to your comment')
  })
})

describe('timeAgo', () => {
  afterEach(async () => { await i18n.changeLanguage('en') })

  const now = new Date('2026-09-14T12:00:00.000Z').getTime()
  const minutesBefore = (minutes: number) => new Date(now - minutes * 60_000).toISOString()

  it.each([
    [0.5, 'Just now'],
    [5, '5m ago'],
    [180, '3h ago'],
    [60 * 24, 'Yesterday'],
    [60 * 24 * 3, '3d ago'],
    [60 * 24 * 15, '2w ago'],
  ])('says %s minutes ago is "%s"', (minutes, expected) => {
    expect(timeAgo(minutesBefore(minutes), t, now)).toBe(expected)
  })

  it('uses the interface language', async () => {
    await i18n.changeLanguage('tr')
    expect(timeAgo(minutesBefore(5), i18n.t.bind(i18n), now)).toBe('5 dk önce')
  })
})
