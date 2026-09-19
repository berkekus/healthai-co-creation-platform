import type { TFunction } from 'i18next'
import type { Notification } from '../types/common.types'

type NotificationContent = Pick<Notification, 'title' | 'body'>
type Metadata = Record<string, string>

/**
 * Notifications created before language-aware content was introduced only have
 * Turkish text in the database, which English-speaking members saw verbatim.
 * These patterns mirror the Turkish templates the API used, so those stored
 * notifications are also shown in the current interface language.
 */
const LEGACY_PATTERNS: { contentKey: string; read: (n: Notification) => Metadata | null }[] = [
  { contentKey: 'meeting_request', read: n => fromBody(n, /^(.+?) "(.+)" için toplantı talep etti\.$/, ['actorName', 'postTitle']) },
  { contentKey: 'meeting_accepted_waiting', read: n => fromBody(n, /^(.+?) toplantı talebinizi kabul etti\. Zaman dilimi onayını bekliyor\. "(.+)"$/, ['actorName', 'postTitle']) },
  { contentKey: 'meeting_accepted', read: n => fromBody(n, /^(.+?) toplantı talebinizi kabul etti\. "(.+)"$/, ['actorName', 'postTitle']) },
  { contentKey: 'meeting_declined', read: n => fromBody(n, /^(.+?) toplantı talebinizi reddetti\. "(.+)"$/, ['actorName', 'postTitle']) },
  { contentKey: 'meeting_auto_declined', read: n => fromBody(n, /^"(.+)" için başka bir toplantı onaylandığından talebiniz otomatik olarak iptal edildi\.$/, ['postTitle']) },
  { contentKey: 'meeting_cancelled_account_deleted', read: n => fromBody(n, /^Karşı taraf hesab(?:ını sildiği|ı silindiği) için "(.+)" görüşmesi iptal edildi\.$/, ['postTitle']) },
  { contentKey: 'meeting_cancelled', read: n => fromBody(n, /^(.+?) toplantı talebini iptal etti\. "(.+)"$/, ['actorName', 'postTitle']) },
  { contentKey: 'meeting_reschedule_requested', read: n => fromBody(n, /^(.+?) toplantıyı yeniden zamanlamak istiyor\. "(.+)"$/, ['actorName', 'postTitle']) },
  { contentKey: 'meeting_completed', read: n => fromBody(n, /^(.+?) görüşmeyi tamamlandı olarak işaretledi\. "(.+)"$/, ['actorName', 'postTitle']) },
  { contentKey: 'partner_found', read: n => fromBody(n, /^"(.+)" için zaten bir işbirliği ortağı bulundu\.$/, ['postTitle']) },
  { contentKey: 'post_interest_received', read: n => fromBody(n, /^(.+?) "(.+)" postunuza ilgi gösterdi\.$/, ['actorName', 'postTitle']) },
  {
    contentKey: 'saved_search_match',
    read: n => n.title === 'Kayıtlı aramanızla eşleşen yeni ilan' ? fromBody(n, /^"(.+?)" — (.+)$/, ['searchName', 'postTitle']) : null,
  },
  {
    contentKey: 'new_message',
    read: n => {
      const match = n.title.match(/^(.+) yeni bir mesaj gönderdi$/)
      return match ? { actorName: match[1], messagePreview: n.body } : null
    },
  },
  { contentKey: 'password_changed', read: n => (n.title === 'Şifre değiştirildi' ? {} : null) },
  { contentKey: 'password_reset', read: n => (n.title === 'Şifre sıfırlandı' ? {} : null) },
]

function fromBody(n: Notification, pattern: RegExp, names: string[]): Metadata | null {
  const match = n.body.match(pattern)
  if (!match) return null
  return Object.fromEntries(names.map((name, index) => [name, match[index + 1]]))
}

function readLegacy(notification: Notification): { contentKey: string; metadata: Metadata } | null {
  for (const pattern of LEGACY_PATTERNS) {
    const metadata = pattern.read(notification)
    if (metadata) return { contentKey: pattern.contentKey, metadata }
  }
  return null
}

export function getNotificationContent(notification: Notification, t: TFunction): NotificationContent {
  const resolved = notification.contentKey
    ? { contentKey: notification.contentKey, metadata: notification.metadata ?? {} }
    : readLegacy(notification)

  if (!resolved) return { title: notification.title, body: notification.body }

  const titleKey = `notificationContent.${resolved.contentKey}.title`
  const bodyKey = `notificationContent.${resolved.contentKey}.body`
  const title = t(titleKey, resolved.metadata)
  const body = t(bodyKey, resolved.metadata)

  // A custom/admin-created notification might use a content key that has not
  // been translated yet. In that case preserve the original stored message.
  if (title === titleKey || body === bodyKey) return { title: notification.title, body: notification.body }
  return { title, body }
}
