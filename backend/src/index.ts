import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import logger from './logger'
import connectDB from '../config/db'
import app from './app'
import { startCronJobs } from './cron'
import { initSocket } from './socket'

const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.fatal(`Fatal: missing required env var ${key}`)
    process.exit(1)
  }
}

if ((process.env.JWT_SECRET as string).length < 32) {
  logger.fatal('Fatal: JWT_SECRET must be at least 32 characters')
  process.exit(1)
}

// Turnstile secret yoksa doğrulama sessizce geçer (fail-open) — prod'da görünür uyarı bas
if (process.env.NODE_ENV === 'production' && !process.env.TURNSTILE_SECRET_KEY) {
  logger.warn('TURNSTILE_SECRET_KEY is not set — CAPTCHA verification is DISABLED in production')
}

const PORT = process.env.PORT || 5000

const httpServer = http.createServer(app)
initSocket(httpServer)

connectDB().then(() => {
  startCronJobs()
  httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running')
  })
})

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled promise rejection')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully')
  httpServer.close(() => undefined)
  try {
    const mongoose = (await import('mongoose')).default
    await mongoose.connection.close()
  } catch { /* already closed */ }
  process.exit(0)
}
process.on('SIGTERM', () => { void shutdown('SIGTERM') })
process.on('SIGINT', () => { void shutdown('SIGINT') })
