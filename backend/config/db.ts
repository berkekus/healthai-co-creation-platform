import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB
