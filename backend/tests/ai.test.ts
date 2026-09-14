import { describe, it, expect, vi, afterEach } from 'vitest'
import { api, createUser } from './helpers'

function geminiReply(text: string) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('POST /api/ai/improve-post', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  it('reports the AI as unavailable when no key is configured', async () => {
    const { token } = await createUser()
    const res = await api
      .post('/api/ai/improve-post')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'ECG triage', description: 'Detect arrhythmia from wearable data.' })
    expect(res.status).toBe(503)
  })

  it('answers 502, not 500, when the model returns broken JSON', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiReply('Here you go: { "improvedTitle": "ECG", oops }'))
    const { token } = await createUser()

    const res = await api
      .post('/api/ai/improve-post')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'ECG triage', description: 'Detect arrhythmia from wearable data.' })
    expect(res.status).toBe(502)
  })

  it('returns the suggestions when the model answers with JSON inside prose', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiReply(
      'Sure! {"improvedTitle":"Wearable ECG arrhythmia triage","suggestedExpertise":["Cardiology","Signal Processing"],"tip":"Name the data source."}',
    ))
    const { token } = await createUser()

    const res = await api
      .post('/api/ai/improve-post')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'ECG triage', description: 'Detect arrhythmia from wearable data.' })
    expect(res.status).toBe(200)
    expect(res.body.data.improvedTitle).toBe('Wearable ECG arrhythmia triage')
    expect(res.body.data.suggestedExpertise).toEqual(['Cardiology', 'Signal Processing'])
  })
})
