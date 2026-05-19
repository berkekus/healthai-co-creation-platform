import cron from 'node-cron'
import Post from '../models/Post'
import logger from './logger'

export function startCronJobs() {
  // Every hour: mark active posts past their expiry date as expired
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Post.updateMany(
        { status: { $in: ['active', 'meeting_scheduled'] }, expiryDate: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      )
      if (result.modifiedCount > 0) {
        logger.info({ count: result.modifiedCount }, 'Cron: posts marked as expired')
      }
    } catch (err) {
      logger.error({ err }, 'Cron: failed to expire posts')
    }
  })
}
