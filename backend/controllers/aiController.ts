import { AuthenticatedRequest } from '../middleware/authMiddleware'
import { asyncHandler } from '../utils/asyncHandler'
import * as aiMatchService from '../services/aiMatchService'
import { makeError } from '../utils/AppError'

export const rankPostMatches = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const posts = Array.isArray(req.body.posts) ? req.body.posts : []
  const matches = await aiMatchService.rankPostsForUser(req.userId, posts)
  res.json({ success: true, data: { matches } })
})

export const translateText = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw makeError('Gemini API key is not configured', 503)

  const { text, targetLang } = req.body
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ success: false, message: 'text is required' })
    return
  }
  const lang = targetLang === 'tr' ? 'Turkish' : 'English'
  const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

  const prompt = `Translate the following text to ${lang}. Return ONLY the translated text, no explanations, no quotes:\n\n${text.slice(0, 2000)}`
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  })
  if (!response.ok) throw makeError(`Gemini ${response.status}`, 502)

  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const translated = payload.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  res.json({ success: true, data: { translated: translated.trim() } })
})

export const improvePost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw makeError('Gemini API key is not configured', 503)

  const { title, description, domain, expertiseRequired } = req.body
  if (!title && !description) {
    res.status(400).json({ success: false, message: 'At least title or description is required' })
    return
  }

  const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const prompt = `You are helping a user improve a healthcare-AI collaboration post.
Return ONLY valid JSON (no markdown, no prose) in this exact shape:
{
  "improvedTitle": "string (max 80 chars, compelling, specific)",
  "improvedDescription": "string (max 500 chars, clear, professional)",
  "suggestedExpertise": ["tag1","tag2","tag3"],
  "tip": "string (1 sentence actionable advice, max 100 chars)"
}

Current post:
- Title: ${title || '(empty)'}
- Domain: ${domain || '(empty)'}
- Expertise required: ${expertiseRequired || '(empty)'}
- Description: ${description || '(empty)'}

Rules:
- Keep the author's intent; improve clarity, specificity, and appeal.
- suggestedExpertise should be 2-4 concise technical/clinical tags relevant to the domain.
- If a field is already good, return it unchanged.
- Do NOT include patient data or IP.`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw makeError(`Gemini ${response.status}: ${errBody.slice(0, 200)}`, 502)
  }

  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = payload.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw makeError('Gemini returned an unexpected format', 502)

  const result = JSON.parse(jsonMatch[0]) as {
    improvedTitle?: string
    improvedDescription?: string
    suggestedExpertise?: string[]
    tip?: string
  }

  res.json({ success: true, data: result })
})
