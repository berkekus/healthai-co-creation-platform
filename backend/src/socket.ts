import { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import logger from './logger'
import { allowedOrigins, vercelPreviewRe } from '../config/origins'

interface JwtPayload {
  id: string
  role: string
}

let io: SocketServer | null = null

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [...allowedOrigins, vercelPreviewRe],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
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
