import { describe, it, expect, vi, afterEach } from 'vitest'
import { api, createUser } from './helpers'
import User from '../models/User'
import { clearAiCaches } from '../utils/aiCache'
import { RATE_LIMITED_MESSAGE, quotaPauseMs, resetGeminiPause } from '../utils/geminiClient'

// The free Gemini tier allows few requests a day for a whole launch crowd, so
// answers are reused and a spent quota is not hammered.

function geminiReply(text: string) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function quotaBody(quotaId: string, retryDelay: string) {
  return JSON.stringify({
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      message: 'You exceeded your current quota.',
      details: [
        { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId }] },
        { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay },
      ],
    },
  })
}

const quotaExceeded = () => new Response(
  quotaBody('GenerateRequestsPerMinutePerProjectPerModel-FreeTier', '30s'),
  { status: 429, headers: { 'Content-Type': 'application/json' } },
)

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

const post = (id: string) => ({
  id, title: `Post ${id}`, domain: 'Cardiology', expertiseRequired: 'ML', description: 'ECG triage',
  authorId: '000000000000000000000000', authorRole: 'healthcare_professional', city: 'Ankara', country: 'Turkey', status: 'active',
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.GEMINI_API_KEY
  delete process.env.RATE_LIMIT_ENABLED
  clearAiCaches()
  resetGeminiPause()
})

describe('reusing AI answers', () => {
  it('shares one translation among everyone reading the same text', async () => {
    const [a, b] = await Promise.all([createUser(), createUser()])
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => geminiReply('Merhaba'))

    for (const { token } of [a, b]) {
      const res = await api.post('/api/ai/translate').set(bearer(token)).send({ text: 'Hello', targetLang: 'tr' })
      expect(res.body.data.translated).toBe('Merhaba')
    }
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('asks for a new profile score only once the profile changes', async () => {
    const { token, user } = await createUser()
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => geminiReply('{"score": 60, "suggestions": []}'))

    await api.get('/api/ai/profile-score?lang=en').set(bearer(token))
    await api.get('/api/ai/profile-score?lang=en').set(bearer(token))
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await User.updateOne({ _id: user.id }, { bio: 'Cardiologist working on ECG triage.' })
    await api.get('/api/ai/profile-score?lang=en').set(bearer(token))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('ranks the same page of posts for the same person only once', async () => {
    const { token } = await createUser()
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => geminiReply(
      '{"matches":[{"postId":"p1","reason":"ML fit","score":80,"expertise":["ML"]}]}',
    ))

    for (let i = 0; i < 2; i++) {
      const res = await api.post('/api/ai/matches').set(bearer(token)).send({ posts: [post('p1'), post('p2')] })
      expect(res.body.data.matches).toHaveLength(1)
    }
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})

describe('a spent Gemini quota', () => {
  it('pauses AI calls and falls back at once instead of retrying', async () => {
    const [a, b] = await Promise.all([createUser(), createUser()])
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => quotaExceeded())

    const first = await api.get('/api/ai/profile-score').set(bearer(a.token))
    expect(first.body.data.source).toBe('rules')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const second = await api.get('/api/ai/profile-score').set(bearer(b.token))
    expect(second.body.data.source).toBe('rules')

    const translation = await api.post('/api/ai/translate').set(bearer(b.token)).send({ text: 'Hello', targetLang: 'tr' })
    expect(translation.status).toBe(429)
    expect(translation.body.message).toBe(RATE_LIMITED_MESSAGE)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not keep a fallback score once the AI answers again', async () => {
    const { token } = await createUser()
    process.env.GEMINI_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => quotaExceeded())
    expect((await api.get('/api/ai/profile-score').set(bearer(token))).body.data.source).toBe('rules')

    resetGeminiPause()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => geminiReply('{"score": 75, "suggestions": []}'))
    expect((await api.get('/api/ai/profile-score').set(bearer(token))).body.data.source).toBe('ai')
  })

  it('waits as long as Google asks, longer for a daily quota', () => {
    expect(quotaPauseMs(quotaBody('GenerateRequestsPerMinutePerProjectPerModel-FreeTier', '45s'))).toBe(45_000)
    expect(quotaPauseMs(quotaBody('GenerateRequestsPerMinutePerProjectPerModel-FreeTier', '2s'))).toBe(30_000)
    expect(quotaPauseMs(quotaBody('GenerateRequestsPerDayPerProjectPerModel-FreeTier', '20s'))).toBe(15 * 60_000)
    expect(quotaPauseMs('not json')).toBe(60_000)
  })
})

describe('the per-person AI allowance', () => {
  it('stops one person from using up the shared quota', async () => {
    const [heavy, other] = await Promise.all([createUser(), createUser()])
    process.env.RATE_LIMIT_ENABLED = 'true'

    const statuses: number[] = []
    for (let i = 0; i < 101; i++) statuses.push((await api.get('/api/ai/profile-score').set(bearer(heavy.token))).status)

    expect(statuses.slice(0, 100).every(s => s === 200)).toBe(true)
    expect(statuses[100]).toBe(429)
    expect((await api.get('/api/ai/profile-score').set(bearer(other.token))).status).toBe(200)
  })
})
