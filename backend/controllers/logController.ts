import { AuthRequest } from '../middleware/authMiddleware'
import * as logService from '../services/logService'
import { asyncHandler } from '../utils/asyncHandler'

export const getLogs = asyncHandler<AuthRequest>(async (req, res) => {
  // qs turns ?result[$ne]=x into an object; only plain strings may reach the query.
  const text = (value: unknown) => (typeof value === 'string' ? value : undefined)
  const int = (value: unknown) => (typeof value === 'string' ? parseInt(value, 10) : undefined)
  const { userId, action, result, from, to, limit, page } = req.query
  const data = await logService.getLogs({
    userId: text(userId),
    action: text(action),
    result: text(result),
    from: text(from),
    to: text(to),
    limit: int(limit),
    page: int(page),
  })
  res.json({ success: true, data })
})
