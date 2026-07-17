import mongoose from 'mongoose'
import logger from '../src/logger'

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 3000

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }

  // Cold start'ta Atlas bağlantısı gecikebilir — birkaç deneme yap
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(uri)
      logger.info({ host: conn.connection.host }, 'MongoDB connected')
      return
    } catch (error) {
      logger.error({ err: error, attempt, maxRetries: MAX_RETRIES }, 'MongoDB connection error')
      if (attempt === MAX_RETRIES) process.exit(1)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }
  }
}

export default connectDB
