import cron from 'node-cron'
import Post from '../models/Post'

export function startCronJobs() {
  // Every hour: mark active posts past their expiry date as expired
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Post.updateMany(
        { status: 'active', expiryDate: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      )
      if (result.modifiedCount > 0) {
        console.log(`[cron] Marked ${result.modifiedCount} post(s) as expired`)
      }
    } catch (err) {
      console.error('[cron] Failed to expire posts:', err)
    }
  })
}
