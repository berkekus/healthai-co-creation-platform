import User from '../models/User'
import { makeError } from '../utils/AppError'
import { fetchGeminiContent, extractGeminiText, type GeminiResponse } from '../utils/geminiClient'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-latest'

export interface ProfileScoreResult {
  score: number
  /** Tips as text: English for the rule-based score, the requested language for the AI score. */
  suggestions: string[]
  /** Rule-based tips only — stable keys the client translates, in the same order as `suggestions`. */
  suggestionKeys?: string[]
  source: 'ai' | 'rules'
}

/** Languages the AI can be asked to write tips in; anything else gets English. */
const TIP_LANGUAGES = new Map([
  ['en', 'English'],
  ['tr', 'Turkish'],
  ['pt', 'Portuguese'],
  ['es', 'Spanish'],
  ['nl', 'Dutch'],
])

function localScore(user: {
  bio?: string | null
  expertiseTags?: string[]
  institution?: string | null
  city?: string | null
  country?: string | null
  avatarUrl?: string | null
}): ProfileScoreResult {
  const fields = [
    { filled: Boolean(user.bio?.trim()), key: 'add_bio', label: 'Add a bio to describe your background and goals' },
    { filled: (user.expertiseTags?.length ?? 0) >= 3, key: 'add_expertise_tags', label: 'Add at least 3 expertise tags to improve matching' },
    { filled: Boolean(user.institution?.trim()), key: 'add_institution', label: 'Add your institution or organization' },
    { filled: Boolean(user.city?.trim()), key: 'add_city', label: 'Add your city for location-based matching' },
    { filled: Boolean(user.country?.trim()), key: 'add_country', label: 'Add your country' },
    { filled: Boolean(user.avatarUrl?.trim()), key: 'upload_photo', label: 'Upload a profile photo' },
    { filled: (user.expertiseTags?.length ?? 0) >= 5, key: 'add_more_expertise_tags', label: 'Add 5+ expertise tags for best matching results' },
  ]
  const filledCount = fields.filter(f => f.filled).length
  const score = Math.round((filledCount / fields.length) * 100)
  const missing = fields.filter(f => !f.filled).slice(0, 3)
  return {
    score,
    suggestions: missing.map(f => f.label),
    suggestionKeys: missing.map(f => f.key),
    source: 'rules',
  }
}

function parseScoreResponse(text: string): ProfileScoreResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { score?: unknown; suggestions?: unknown }
    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 3)
      : []
    if (score === null) return null
    return { score, suggestions, source: 'ai' }
  } catch {
    return null
  }
}

export async function getProfileScore(userId: string, lang?: unknown): Promise<ProfileScoreResult> {
  const language = (typeof lang === 'string' && TIP_LANGUAGES.get(lang)) || 'English'
  const user = await User.findById(userId).select('bio expertiseTags institution city country avatarUrl name role')
  if (!user) throw makeError('User not found', 404)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return localScore(user)

  const prompt = `You are evaluating the completeness and quality of a healthcare AI collaboration profile.
Return ONLY valid JSON in this exact shape (no markdown, no prose):
{"score": 0-100, "suggestions": ["action 1", "action 2", "action 3"]}

Profile:
- name: ${user.name || '(empty)'}
- role: ${user.role}
- bio: ${user.bio || '(empty)'}
- institution: ${user.institution || '(empty)'}
- city: ${user.city || '(empty)'}
- country: ${user.country || '(empty)'}
- expertise tags: ${(user.expertiseTags ?? []).join(', ') || '(none)'}
- has avatar: ${user.avatarUrl ? 'yes' : 'no'}

Rules:
- score 0-100 based on completeness and quality (not just presence of fields)
- A bio with real content is worth more than a one-word bio
- Having 5+ specific expertise tags is much better than 1-2 vague ones
- suggestions must be SHORT actionable imperatives (max 60 chars each)
- Write the suggestions in ${language}
- Return exactly 3 suggestions for the most impactful improvements
- If profile is 100% complete, return an empty suggestions array`

  try {
    const response = await fetchGeminiContent(GEMINI_MODEL, apiKey, prompt, 0.1)

    if (!response.ok) return localScore(user)

    const payload = await response.json() as GeminiResponse
    const text = extractGeminiText(payload)
    return parseScoreResponse(text) ?? localScore(user)
  } catch {
    return localScore(user)
  }
}
