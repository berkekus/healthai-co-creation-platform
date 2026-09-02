import type { TFunction } from 'i18next'
import type { Notification } from '../types/common.types'

type NotificationContent = Pick<Notification, 'title' | 'body'>

function getLegacyMetadata(notification: Notification): Record<string, string> | undefined {
  if (notification.type !== 'meeting_request') return undefined

  // Notifications created before language-aware content was introduced only
  // have Turkish text in the database. Parse the known format so existing
  // meeting requests also immediately respect the current interface language.
  const match = notification.body.match(/^(.*?) "(.+)" için toplantı talep etti\.$/)
  if (!match) return undefined
  return { actorName: match[1], postTitle: match[2] }
}

export function getNotificationContent(notification: Notification, t: TFunction): NotificationContent {
  const contentKey = notification.contentKey ??
    (notification.type === 'meeting_request' ? 'meeting_request' : undefined)
  const metadata = notification.metadata ?? getLegacyMetadata(notification)

  if (!contentKey || !metadata) return { title: notification.title, body: notification.body }

  const titleKey = `notificationContent.${contentKey}.title`
  const bodyKey = `notificationContent.${contentKey}.body`
  const title = t(titleKey, metadata)
  const body = t(bodyKey, metadata)

  // A custom/admin-created notification might use a content key that has not
  // been translated yet. In that case preserve the original stored message.
  if (title === titleKey || body === bodyKey) return { title: notification.title, body: notification.body }
  return { title, body }
}
