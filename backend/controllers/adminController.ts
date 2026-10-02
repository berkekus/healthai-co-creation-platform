import { Request } from 'express'
import User from '../models/User'
import Post from '../models/Post'
import Meeting from '../models/Meeting'
import { asyncHandler } from '../utils/asyncHandler'

// The admin chart offers up to 30 days; one extra day covers the start of the oldest local day.
const GROWTH_WINDOW_DAYS = 31

function validTimeZone(value: unknown): string {
  if (typeof value !== 'string' || value.length > 64) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return 'UTC'
  }
}

/**
 * Sign-ups per calendar day in the viewer's time zone, counted in the database, plus everyone who joined
 * earlier. The chart's running total is totalBefore + the counts up to each day, so it never depends on
 * how many users a list endpoint returns.
 */
async function userGrowth(timezone: string) {
  const windowStart = new Date(Date.now() - GROWTH_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const [daily, totalBefore] = await Promise.all([
    User.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: windowStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ createdAt: { $lt: windowStart } }),
  ])
  return { timezone, totalBefore, daily: daily.map(d => ({ date: d._id, count: d.count })) }
}

export const getPlatformStats = asyncHandler<Request>(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    usersByRole,
    postsByStatus,
    postsByDomain,
    meetingsByStatus,
    newUsersLast30,
    newPostsLast30,
    growth,
  ] = await Promise.all([
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    Post.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Post.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Meeting.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    userGrowth(validTimeZone(req.query.tz)),
  ])

  const totalMeetings = meetingsByStatus.reduce((s: number, m: { count: number }) => s + m.count, 0)
  const completedMeetings = meetingsByStatus.find((m: { _id: string }) => m._id === 'completed')?.count ?? 0
  const meetingCompletionRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0

  res.json({
    success: true,
    data: {
      usersByRole:         Object.fromEntries(usersByRole.map((r: { _id: string; count: number }) => [r._id, r.count])),
      postsByStatus:       Object.fromEntries(postsByStatus.map((r: { _id: string; count: number }) => [r._id, r.count])),
      postsByDomain:       postsByDomain.map((r: { _id: string; count: number }) => ({ domain: r._id, count: r.count })),
      meetingsByStatus:    Object.fromEntries(meetingsByStatus.map((r: { _id: string; count: number }) => [r._id, r.count])),
      meetingCompletionRate,
      newUsersLast30,
      newPostsLast30,
      userGrowth: growth,
    },
  })
})
