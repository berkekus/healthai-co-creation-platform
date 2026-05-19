import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import mongoose from 'mongoose'
import mongoSanitize from 'express-mongo-sanitize'
import authRoutes from '../routes/authRoutes'
import postRoutes from '../routes/postRoutes'
import meetingRoutes from '../routes/meetingRoutes'
import conversationRoutes from '../routes/conversationRoutes'
import notificationRoutes from '../routes/notificationRoutes'
import logRoutes from '../routes/logRoutes'
import aiRoutes from '../routes/aiRoutes'
import { errorHandler, notFound } from '../middleware/errorHandler'

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean) as string[]

const vercelPreviewRe = /^https:\/\/healthai-co-creation-platform(-[a-z0-9]+-berkekus-projects)?\.vercel\.app$/

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin) || vercelPreviewRe.test(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(mongoSanitize())

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1
  const status = dbReady ? 'ok' : 'degraded'
  res.status(dbReady ? 200 : 503).json({ status, db: dbReady ? 'connected' : 'disconnected', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/ai', aiRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
