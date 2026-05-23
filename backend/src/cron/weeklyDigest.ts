import User from '../../models/User'
import Post from '../../models/Post'
import Meeting from '../../models/Meeting'
import Message from '../../models/Message'
import Conversation from '../../models/Conversation'
import logger from '../logger'

const APP_URL = process.env.APP_BASE_URL ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

async function buildDigestHtml(user: {
  name: string
  email: string
  expertiseTags: string[]
  role: string
}) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [newPosts, upcomingMeetings, unreadCount] = await Promise.all([
    Post.find({
      status: 'active',
      createdAt: { $gte: oneWeekAgo },
      expertiseRequired: user.expertiseTags.length > 0
        ? { $in: user.expertiseTags.map(t => new RegExp(t, 'i')) }
        : undefined,
    }).sort({ createdAt: -1 }).limit(5).lean(),

    Meeting.find({
      $or: [{ requesterId: user.email }, { ownerEmail: user.email }],
      status: { $in: ['confirmed', 'pending', 'time_proposed'] },
    }).limit(5).lean(),

    (async () => {
      const userDoc = await User.findOne({ email: user.email }).select('_id').lean()
      if (!userDoc) return 0
      const convIds = (await Conversation.find({ participants: userDoc._id }).select('_id').lean()).map(c => c._id)
      if (convIds.length === 0) return 0
      return Message.countDocuments({
        conversationId: { $in: convIds },
        senderId: { $ne: userDoc._id },
        readBy: { $ne: userDoc._id },
      })
    })(),
  ])

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f6f7f9;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(54,33,62,0.08)">
    <div style="background:#36213E;padding:24px 32px">
      <p style="color:#fff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px">HEALTH AI Co-Creation Platform</p>
      <h1 style="color:#6FB8C4;font-size:22px;font-weight:900;margin:0">Your Weekly Digest</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px">Hi ${user.name},</p>
      <p style="color:#6F6878;font-size:14px">Here's what happened on the platform this week.</p>

      ${unreadCount > 0 ? `
      <div style="background:#E8F4F7;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;color:#36213E;font-size:14px;font-weight:700">
          💬 You have <strong>${unreadCount}</strong> unread message${unreadCount > 1 ? 's' : ''}
        </p>
        <a href="${APP_URL}/messages" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#6FB8C4">Read messages →</a>
      </div>` : ''}

      ${upcomingMeetings.length > 0 ? `
      <h2 style="color:#36213E;font-size:15px;font-weight:900;margin:24px 0 12px">Upcoming Meetings (${upcomingMeetings.length})</h2>
      ${upcomingMeetings.map(m => `
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:12px 16px;margin-bottom:8px">
          <p style="margin:0;font-size:13px;font-weight:700;color:#36213E">${m.postTitle}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6F6878">Status: ${m.status}</p>
        </div>`).join('')}
      <a href="${APP_URL}/meetings" style="display:inline-block;margin-top:4px;font-size:12px;font-weight:700;color:#6FB8C4">View all meetings →</a>` : ''}

      ${newPosts.length > 0 ? `
      <h2 style="color:#36213E;font-size:15px;font-weight:900;margin:24px 0 12px">New Posts Matching Your Expertise (${newPosts.length})</h2>
      ${newPosts.map(p => `
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:12px 16px;margin-bottom:8px">
          <p style="margin:0;font-size:13px;font-weight:700;color:#36213E">${p.title}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6F6878">${p.domain} · ${p.city}, ${p.country}</p>
          <a href="${APP_URL}/posts/${p._id}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:#6FB8C4">View post →</a>
        </div>`).join('')}` : ''}

      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB">
        <p style="font-size:12px;color:#9CA3AF;margin:0">
          You're receiving this because you opted in to weekly digests.
          <a href="${APP_URL}/profile" style="color:#6FB8C4;font-weight:700">Manage preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function sendWeeklyDigests(): Promise<void> {
  const { default: nodemailer } = await import('nodemailer')
  const host = process.env.SMTP_HOST
  if (!host) {
    logger.warn('Weekly digest: SMTP not configured, skipping')
    return
  }

  const users = await User.find({ 'notifPrefs.weeklyDigest': true, isSuspended: false })
    .select('name email expertiseTags role notifPrefs')
    .lean()

  logger.info({ count: users.length }, 'Sending weekly digests')

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })

  const FROM = process.env.SMTP_FROM ?? '"HEALTH AI" <noreply@healthai.local>'

  for (const user of users) {
    try {
      const html = await buildDigestHtml({
        name: user.name,
        email: user.email,
        expertiseTags: user.expertiseTags ?? [],
        role: user.role,
      })
      await transporter.sendMail({
        from: FROM,
        to: user.email,
        subject: 'Your HEALTH AI Weekly Digest',
        html,
      })
    } catch (err) {
      logger.warn({ email: user.email, err }, 'Weekly digest send failed')
    }
  }

  logger.info('Weekly digest send complete')
}
