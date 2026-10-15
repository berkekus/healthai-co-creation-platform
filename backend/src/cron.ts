import cron from 'node-cron'
import logger from './logger'
import { sendWeeklyDigests } from './cron/weeklyDigest'
import { expireDuePosts } from '../services/postService'

async function expirePosts(trigger: string) {
  try {
    const count = await expireDuePosts()
    if (count > 0) logger.info({ count, trigger }, 'Posts marked as expired')
  } catch (err) {
    logger.error({ err, trigger }, 'Failed to expire posts')
  }
}

export function startCronJobs() {
  // A sleeping server misses the hourly run, so catch up as soon as it wakes.
  void expirePosts('startup')

  // Every hour: mark active posts past their expiry date as expired
  cron.schedule('0 * * * *', () => expirePosts('cron'))

  // Every Monday at 09:00: send weekly digest emails
  cron.schedule('0 9 * * 1', async () => {
    try {
      await sendWeeklyDigests()
    } catch (err) {
      logger.error({ err }, 'Cron: weekly digest failed')
    }
  })
}
