import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import mongoSanitize from 'express-mongo-sanitize'
import authRoutes from '../routes/authRoutes'
import postRoutes from '../routes/postRoutes'
import meetingRoutes from '../routes/meetingRoutes'
import notificationRoutes from '../routes/notificationRoutes'
import logRoutes from '../routes/logRoutes'
import { errorHandler, notFound } from '../middleware/errorHandler'
import { authLimiter } from '../middleware/rateLimiter'

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean) as string[]

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(mongoSanitize())

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/logs', logRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
