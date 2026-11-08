import logger from '../src/logger'

const RETRYABLE_STATUSES = new Set([503, 504])
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000
const ATTEMPT_TIMEOUT_MS = 12000

export const RATE_LIMITED_MESSAGE = 'AI service is temporarily rate-limited. Please try again in a minute.'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function timeoutResponse(): Response {
  return new Response(
    JSON.stringify({ error: { code: 504, message: 'Gemini request timed out', status: 'DEADLINE_EXCEEDED' } }),
    { status: 504, headers: { 'Content-Type': 'application/json' } },
  )
}

function pausedResponse(): Response {
  return new Response(
    JSON.stringify({ error: { code: 429, message: 'Paused after a quota error', status: 'RESOURCE_EXHAUSTED' } }),
    { status: 429, headers: { 'Content-Type': 'application/json' } },
  )
}

// A 429 means the project's quota is spent: retrying in a second only burns
// time, and every visitor would wait through the retries before the fallback.
// So all calls stop until the quota has had time to refill.
const MIN_PAUSE_MS = 30_000
const DEFAULT_PAUSE_MS = 60_000
const DAILY_QUOTA_PAUSE_MS = 15 * 60_000
let pausedUntil = 0

/** How long to stop calling, from Google's 429 body: its RetryInfo delay, or longer for a daily quota. */
export function quotaPauseMs(body: string): number {
  if (/PerDay/i.test(body)) return DAILY_QUOTA_PAUSE_MS
  const seconds = Number(body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/)?.[1])
  if (!seconds) return DEFAULT_PAUSE_MS
  return Math.min(Math.max(seconds * 1000, MIN_PAUSE_MS), DAILY_QUOTA_PAUSE_MS)
}

/** For tests: lift a pause right away. */
export function resetGeminiPause(): void {
  pausedUntil = 0
}

/**
 * Calls Gemini's generateContent endpoint, retrying up to twice on 503/504 —
 * Google's own error text for 503 says the spike is "usually temporary" and
 * to retry — and on a request that never responds at all (some model ids
 * have been observed to hang indefinitely rather than error). Each attempt
 * is capped at ATTEMPT_TIMEOUT_MS and aborted if it doesn't respond in time.
 * A 429 pauses every call for a while (see quotaPauseMs); while paused, the
 * answer is a 429 straight away. Returns the raw Response so callers keep
 * their existing status-code handling.
 */
export async function fetchGeminiContent(
  model: string,
  apiKey: string,
  prompt: string,
  temperature: number,
): Promise<Response> {
  if (Date.now() < pausedUntil) return pausedResponse()

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  })

  let response: Response = timeoutResponse()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS)

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      })
    } catch {
      response = timeoutResponse()
    } finally {
      clearTimeout(timer)
    }

    if (response.status === 429) {
      const pauseMs = quotaPauseMs(await response.clone().text().catch(() => ''))
      pausedUntil = Date.now() + pauseMs
      logger.warn({ pauseSeconds: Math.round(pauseMs / 1000) }, 'Gemini quota exceeded; pausing AI calls')
      return response
    }

    if (response.ok || !RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
      return response
    }
    await sleep(RETRY_DELAY_MS * attempt)
  }

  return response
}

export interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

export function extractGeminiText(payload: GeminiResponse, join = ''): string {
  return payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join(join) ?? ''
}
