import { Request } from 'express'
import User from '../models/User'
import Post from '../models/Post'
import Meeting from '../models/Meeting'
import { asyncHandler } from '../utils/asyncHandler'

export const getPlatformStats = asyncHandler<Request>(async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    usersByRole,
    postsByStatus,
    postsByDomain,
    meetingsByStatus,
    newUsersLast30,
    newPostsLast30,
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
    },
  })
})
