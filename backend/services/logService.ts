import Log from '../models/Log'

export async function createLog(data: {
  userId?: string
  userEmail: string
  role?: string
  action: string
  targetEntityId?: string
  result: 'success' | 'failure'
  ipAddress?: string
}) {
  return Log.create({ ...data, timestamp: new Date() })
}

export async function getLogs(filters: {
  userId?: string
  action?: string
  result?: string
  from?: string
  to?: string
  limit?: number
  page?: number
}) {
  const query: Record<string, unknown> = {}

  if (filters.userId) query.userId = filters.userId
  if (filters.action) query.action = { $regex: filters.action, $options: 'i' }
  if (filters.result) query.result = filters.result
  if (filters.from || filters.to) {
    query.timestamp = {
      ...(filters.from ? { $gte: new Date(filters.from) } : {}),
      ...(filters.to ? { $lte: new Date(filters.to) } : {}),
    }
  }

  const limit = Math.min(filters.limit ?? 50, 200)
  const skip = ((filters.page ?? 1) - 1) * limit
  const total = await Log.countDocuments(query)
  const logs = await Log.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit)

  return { logs, total, page: filters.page ?? 1, limit }
}
