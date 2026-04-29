import { AuthRequest } from '../middleware/authMiddleware'
import * as logService from '../services/logService'
import { asyncHandler } from '../utils/asyncHandler'

export const getLogs = asyncHandler<AuthRequest>(async (req, res) => {
  const { userId, action, result, from, to, limit, page } = req.query
  const data = await logService.getLogs({
    userId: userId as string,
    action: action as string,
    result: result as string,
    from: from as string,
    to: to as string,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    page: page ? parseInt(page as string, 10) : undefined,
  })
  res.json({ success: true, data })
})
