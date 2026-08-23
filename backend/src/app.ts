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
import savedSearchRoutes from '../routes/savedSearchRoutes'
import commentRoutes, { commentRouter } from '../routes/commentRoutes'
import { errorHandler, notFound } from '../middleware/errorHandler'
import passport from 'passport'
import { initPassport } from './passport'

initPassport()

const app = express()
app.set('trust proxy', 1)

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  process.env.CLIENT_ORIGIN,
  // Support an optional second production origin (e.g. a second team member's Vercel)
  process.env.CLIENT_ORIGIN_EXTRA,
].filter(Boolean) as string[]

// Allow any Vercel preview/production URL for this project
const vercelPreviewRe = /^https:\/\/healthai-co-creation-platform(-[a-z0-9]+)?(-[a-z0-9]+-[a-z0-9]+-projects)?\.vercel\.app$/

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
app.use(passport.initialize())

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
app.use('/api/saved-searches', savedSearchRoutes)
app.use('/api/posts/:id/comments', commentRoutes)
app.use('/api/comments', commentRouter)

app.use(notFound)
app.use(errorHandler)

export default app
