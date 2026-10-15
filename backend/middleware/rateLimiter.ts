import rateLimit from 'express-rate-limit'

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  // Off by default so testers sharing one network/IP aren't locked out;
  // set RATE_LIMIT_ENABLED=true to turn it back on. Always off in tests.
  skip: () => process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_ENABLED !== 'true',
}

// /api/auth — 20 attempts per 15 minutes
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
})

// POST /api/posts — 50 new posts per 24 hours per IP
export const postCreateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
})

// POST /api/meetings — 10 meeting requests per hour per IP
export const meetingRequestLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 10,
})

// POST /api/notifications — 30 notifications per minute per IP
export const notificationCreateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 30,
})
