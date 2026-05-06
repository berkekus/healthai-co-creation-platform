import pino from 'pino'

const logger = pino(
  process.env.NODE_ENV === 'production'
    ? { level: 'info' }
    : {
        level: 'debug',
        transport: { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } },
      }
)

export default logger
