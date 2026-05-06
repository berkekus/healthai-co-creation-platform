import mongoose from 'mongoose'
import logger from '../src/logger'

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }

  try {
    const conn = await mongoose.connect(uri)
    logger.info({ host: conn.connection.host }, 'MongoDB connected')
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error')
    process.exit(1)
  }
}

export default connectDB
