// Tek kaynak: HTTP CORS (app.ts) ve Socket.io (socket.ts) aynı origin kurallarını kullanır.

export const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  process.env.CLIENT_ORIGIN,
  // Support an optional second production origin (e.g. a second team member's Vercel)
  process.env.CLIENT_ORIGIN_EXTRA,
].filter(Boolean) as string[]

// Allow any Vercel preview/production URL for this project
export const vercelPreviewRe = /^https:\/\/healthai-co-creation-platform(-[a-z0-9]+)?(-[a-z0-9]+-[a-z0-9]+-projects)?\.vercel\.app$/

export function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.includes(origin) || vercelPreviewRe.test(origin)
}
