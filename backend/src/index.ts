import dotenv from 'dotenv'
dotenv.config()

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

import connectDB from '../config/db'
import app from './app'
import { startCronJobs } from './cron'
import logger from './logger'

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  startCronJobs()
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running')
  })
})
