const RETRYABLE_STATUSES = new Set([429, 503, 504])
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000
const ATTEMPT_TIMEOUT_MS = 12000

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function timeoutResponse(): Response {
  return new Response(
    JSON.stringify({ error: { code: 504, message: 'Gemini request timed out', status: 'DEADLINE_EXCEEDED' } }),
    { status: 504, headers: { 'Content-Type': 'application/json' } },
  )
}

/**
 * Calls Gemini's generateContent endpoint, retrying up to twice on 429/503 —
 * Google's own error text for 503 says the spike is "usually temporary" and
 * to retry — and on a request that never responds at all (some model ids
 * have been observed to hang indefinitely rather than error). Each attempt
 * is capped at ATTEMPT_TIMEOUT_MS and aborted if it doesn't respond in time.
 * Returns the raw Response so callers keep their existing status-code
 * handling; only the last attempt's response/synthetic-timeout is returned.
 */
export async function fetchGeminiContent(
  model: string,
  apiKey: string,
  prompt: string,
  temperature: number,
): Promise<Response> {
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
