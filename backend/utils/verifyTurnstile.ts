export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  // Skip in non-production or when secret key is not configured
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || process.env.NODE_ENV !== 'production') return true
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}
