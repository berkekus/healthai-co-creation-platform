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

describe('POST /api/ai/translate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  it('translates into any interface language, not only English and Turkish', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiReply('Parteras da nossa enfermaria…'))
    const { token } = await createUser()

    const res = await api
      .post('/api/ai/translate')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Midwives on our ward want an early warning.', targetLang: 'pt' })

    expect(res.status).toBe(200)
    expect(res.body.data.translated).toBe('Parteras da nossa enfermaria…')
    const [, init] = fetchSpy.mock.calls[0]
    expect(String((init as RequestInit).body)).toContain('Translate the following text to Portuguese')
  })
})

describe('GET /api/ai/profile-score', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  it('gives each rule-based tip a key the interface can show in any language', async () => {
    const { token } = await createUser()

    const res = await api.get('/api/ai/profile-score').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.source).toBe('rules')
    expect(res.body.data.suggestionKeys).toEqual(['add_bio', 'add_expertise_tags', 'upload_photo'])
    expect(res.body.data.suggestions).toHaveLength(3)
  })

  it('asks the model for tips in the reader’s language', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiReply('{"score": 70, "suggestions": ["Profil fotoğrafı ekleyin"]}'))
    const { token } = await createUser()

    const res = await api.get('/api/ai/profile-score?lang=tr').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ score: 70, suggestions: ['Profil fotoğrafı ekleyin'], source: 'ai' })
    const [, init] = fetchSpy.mock.calls[0]
    expect(String((init as RequestInit).body)).toContain('Write the suggestions in Turkish')
  })
})
