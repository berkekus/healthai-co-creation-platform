import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'
import type { AuthRequest } from './authMiddleware'

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  // Off by default so testers sharing one network/IP aren't locked out;
  // set RATE_LIMIT_ENABLED=true to turn it back on. Always off in tests.
  skip: () => process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_ENABLED !== 'true',
}

// A class on campus Wi-Fi, an office or a mobile carrier's NAT puts many people
// behind one public IP. Per-IP limits therefore only guard against floods; the
// tight limits are keyed on the account or on the signed-in user.
const ipKey = (req: Request) => ipKeyGenerator(req.ip ?? '')
const emailOf = (req: Request) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
// Used after `protect`; the IP is only a fallback
const userKey = (req: Request) => (req as AuthRequest).userId ?? ipKey(req)

// Unauthenticated /api/auth mutations — 600 requests per 15 minutes per IP
export const authIpLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 600,
})

// POST /api/auth/login — 10 failed attempts per account per IP in 15 minutes
export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: req => `${ipKey(req)}|${emailOf(req)}`,
})

// Endpoints that send mail — 5 mails per address per hour, so no inbox can be flooded
export const emailSendLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipFailedRequests: true,
  keyGenerator: req => `mail|${emailOf(req)}`,
})

// POST /api/posts — 50 new posts per 24 hours per user
export const postCreateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  keyGenerator: userKey,
})

// POST /api/meetings — 10 meeting requests per hour per user
export const meetingRequestLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: userKey,
})

// POST /api/notifications — 30 notifications per minute per user
export const notificationCreateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userKey,
})
