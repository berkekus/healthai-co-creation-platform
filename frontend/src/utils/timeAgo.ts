import type { TFunction } from 'i18next'

/** "5m ago", "Yesterday", "2w ago" — in the interface language. */
export function timeAgo(iso: string, t: TFunction, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return t('common.justNow')
  if (minutes < 60) return t('common.minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('common.hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t('common.yesterday')
  if (days < 7) return t('common.daysAgo', { count: days })
  return t('common.weeksAgo', { count: Math.floor(days / 7) })
}
