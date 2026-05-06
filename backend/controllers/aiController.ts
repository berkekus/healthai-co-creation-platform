import { AuthenticatedRequest } from '../middleware/authMiddleware'
import { asyncHandler } from '../utils/asyncHandler'
import * as aiMatchService from '../services/aiMatchService'

export const rankPostMatches = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const posts = Array.isArray(req.body.posts) ? req.body.posts : []
  const matches = await aiMatchService.rankPostsForUser(req.userId, posts)
  res.json({ success: true, data: { matches } })
})
