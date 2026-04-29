import { Request, Response, NextFunction } from 'express'
import { MulterError } from 'multer'

export interface AppError extends Error {
  statusCode?: number
}

interface MongooseValidationError extends AppError {
  errors?: Record<string, { message: string }>
}

export const errorHandler = (
  err: MongooseValidationError & { name?: string; code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Always log server errors to stderr, never expose internals to client
  if (err.statusCode === undefined || err.statusCode >= 500) {
    console.error(`[ERROR] ${err.name ?? 'Error'}: ${err.message}`)
  }

  // Multer errors (file upload)
  if ((err as unknown) instanceof MulterError) {
    const me = err as unknown as MulterError
    const msg = me.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : me.message
    res.status(400).json({ success: false, message: msg })
    return
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' })
    return
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    res.status(409).json({ success: false, message: 'Already exists' })
    return
  }

  // Mongoose ValidationError — extract first field message instead of the full chain
  if (err.name === 'ValidationError' && err.errors) {
    const first = Object.values(err.errors)[0]
    res.status(400).json({ success: false, message: first?.message ?? err.message })
    return
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
    return
  }

  const statusCode = err.statusCode ?? 500
  const message = statusCode >= 500 ? 'Internal server error' : err.message
  res.status(statusCode).json({ success: false, message })
}

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Route not found' })
}
