import Log from '../models/Log'
import { escapeRegex } from '../constants/domains'

const LOG_RESULTS = ['success', 'failure']

export async function createLog(data: {
  userId?: string
  userEmail: string
  role?: string
  action: string
  targetEntityId?: string
  result: 'success' | 'failure'
  ipAddress?: string
}) {
  return Log.create(data)
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
  // Partial, case-insensitive match on the literal text: user input never runs as a regex (ReDoS / invalid pattern).
  if (filters.action) query.action = { $regex: escapeRegex(filters.action), $options: 'i' }
  if (filters.result && LOG_RESULTS.includes(filters.result)) query.result = filters.result
  if (filters.from || filters.to) {
    const fromDate = filters.from ? new Date(filters.from) : undefined
    const toDate   = filters.to   ? new Date(filters.to)   : undefined
    if (fromDate && isNaN(fromDate.getTime())) throw Object.assign(new Error('Invalid `from` date'), { statusCode: 400 })
    if (toDate   && isNaN(toDate.getTime()))   throw Object.assign(new Error('Invalid `to` date'),   { statusCode: 400 })
    query.createdAt = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate   ? { $lte: toDate }   : {}),
    }
  }

  const limit = Math.min(positiveInt(filters.limit) ?? 50, 200)
  const page = positiveInt(filters.page) ?? 1
  const skip = (page - 1) * limit
  const [total, logs] = await Promise.all([
    Log.countDocuments(query),
    Log.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])

  return { logs, total, page, limit }
}

function positiveInt(value: number | undefined) {
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined
}
