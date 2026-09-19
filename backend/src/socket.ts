import { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import logger from './logger'
import User from '../models/User'

interface JwtPayload {
  id: string
  role: string
  tokenVersion?: number
}

let io: SocketServer | null = null

export function initSocket(httpServer: HttpServer): SocketServer {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    process.env.CLIENT_ORIGIN,
  ].filter(Boolean) as string[]

  io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
      const user = await User.findById(decoded.id).select('isSuspended tokenVersion').lean()
      if (!user || user.isSuspended) return next(new Error('Invalid token'))
      if ((decoded.tokenVersion ?? 0) !== user.tokenVersion) {
        return next(new Error('Session expired'))
      }
      socket.data.userId = decoded.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    socket.join(`user:${userId}`)
    logger.debug({ userId }, 'Socket connected')

    socket.on('disconnect', () => {
      logger.debug({ userId }, 'Socket disconnected')
    })
  })

  logger.info('Socket.io initialized')
  return io
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return
  io.to(`user:${userId}`).emit(event, data)
}
