import User from '../models/User'
import { makeError } from '../utils/AppError'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
const MAX_POSTS_TO_ANALYZE = 10

export interface MatchPostInput {
  id: string
  title: string
  domain: string
  expertiseRequired: string
  description: string
  authorId: string
  authorRole: string
  city: string
  country: string
  status: string
}

export interface AIMatchSuggestion {
  postId: string
  reason: string
  score: number
  expertise: string[]
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function clampScore(score: unknown) {
  return Math.max(0, Math.min(100, Math.round(typeof score === 'number' ? score : 0)))
}

function parseSuggestions(text: string): AIMatchSuggestion[] {
  const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown
    const rows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { matches?: unknown }).matches)
        ? (parsed as { matches: unknown[] }).matches
        : []

    return rows
      .map(row => {
        const item = row as Partial<AIMatchSuggestion>
        if (typeof item.postId !== 'string' || typeof item.reason !== 'string') return null
        return {
          postId: item.postId,
          reason: item.reason.slice(0, 70).trim(),
          score: clampScore(item.score),
          expertise: Array.isArray(item.expertise) ? item.expertise.filter((x): x is string => typeof x === 'string').slice(0, 3) : [],
        }
      })
      .filter((item): item is AIMatchSuggestion => Boolean(item && item.score > 0))
  } catch {
    return []
  }
}

export async function rankPostsForUser(userId: string, posts: MatchPostInput[]) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw makeError('Gemini API key is not configured', 503)

  const user = await User.findById(userId).select('role city country expertiseTags bio')
  if (!user) throw makeError('User not found', 404)

  const candidates = posts
    .filter(post => post.id && post.status === 'active' && post.authorId !== userId)
    .slice(0, MAX_POSTS_TO_ANALYZE)

  if (!candidates.length) return []

  const prompt = `You are matching users to healthcare AI collaboration posts.
Return ONLY valid JSON in this exact shape:
{"matches":[{"postId":"string","reason":"max 70 chars","score":0-100,"expertise":["short area"]}]}

User:
- role: ${user.role}
- location: ${user.city}, ${user.country}
- expertise tags: ${(user.expertiseTags ?? []).join(', ') || 'none'}
- bio: ${user.bio || 'none'}

Rules:
- Prefer cross-role collaboration: engineers should match clinician posts, clinicians should match engineer posts.
- Prefer semantic overlap between user expertise and required expertise.
- Location can help, but expertise fit is more important.
- Score 0 when there is no useful fit.
- Do not include posts with score below 25.

Posts:
${JSON.stringify(candidates.map(post => ({
    postId: post.id,
    title: post.title,
    domain: post.domain,
    requiredExpertise: post.expertiseRequired,
    description: post.description.slice(0, 900),
    authorRole: post.authorRole,
    location: `${post.city}, ${post.country}`,
  })))}`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw makeError(`Gemini ${response.status}: ${errBody.slice(0, 200)}`, 502)
  }

  const payload = await response.json() as GeminiResponse
  const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('\n') ?? ''
  const allowedIds = new Set(candidates.map(post => post.id))
  return parseSuggestions(text)
    .filter(item => allowedIds.has(item.postId))
    .sort((a, b) => b.score - a.score)
}
