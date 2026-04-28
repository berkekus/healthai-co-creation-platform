import dotenv from 'dotenv'
dotenv.config()

const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Fatal: missing required env var ${key}`)
    process.exit(1)
  }
}

import connectDB from '../config/db'
import app from './app'

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
