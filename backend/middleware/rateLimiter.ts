import type { Request } from 'express'
import { rateLimit, ipKeyGenerator, type Options } from 'express-rate-limit'

/**
 * On in production, off elsewhere; RATE_LIMIT_ENABLED=true|false overrides either way.
 *
 * The October usability session had a whole classroom behind one university IP, and
 * per-IP limits locked them out together. So limits that matter are now counted per
 * account (or per email address), and the per-IP limit is only a high ceiling.
 */
function limitsEnabled(): boolean {
  const flag = process.env.RATE_LIMIT_ENABLED
  if (flag === 'true') return true
  if (flag === 'false') return false
  return process.env.NODE_ENV === 'production'
}

const ipKey = (req: Request) => ipKeyGenerator(req.ip ?? '')
const emailOf = (req: Request) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
const userKey = (req: Request) => {
  const userId = (req as Request & { userId?: string }).userId
  return userId ? `user:${userId}` : `ip:${ipKey(req)}`
}

function limiter(options: Partial<Options>) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
    skip: () => !limitsEnabled(),
    ...options,
  })
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/** Ceiling on all sign-in/sign-up traffic from one address; high enough for a shared campus network. */
export const authIpLimiter = limiter({ windowMs: 15 * MINUTE, limit: 300, keyGenerator: ipKey })

/** Wrong passwords per address and account: stops guessing one account without locking out the room. */
export const loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: req => `${ipKey(req)}|${emailOf(req)}`,
})

/** Requests that send an email (sign-up link, reset link, re-sent link), per recipient. */
export const emailActionLimiter = limiter({
  windowMs: HOUR,
  limit: 5,
  keyGenerator: req => emailOf(req) || `ip:${ipKey(req)}`,
})

/** POST /api/posts — new posts per member per day. */
export const postCreateLimiter = limiter({ windowMs: 24 * HOUR, limit: 30, keyGenerator: userKey })

/** POST /api/meetings — meeting requests per member per hour. */
export const meetingRequestLimiter = limiter({ windowMs: HOUR, limit: 20, keyGenerator: userKey })

/** POST /api/notifications (admins) — notifications per admin per minute. */
export const notificationCreateLimiter = limiter({ windowMs: MINUTE, limit: 60, keyGenerator: userKey })
