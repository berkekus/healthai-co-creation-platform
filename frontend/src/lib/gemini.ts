import { useState, useCallback } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Post } from '../types/post.types'
import type { User } from '../types/auth.types'

const GEMINI_MODEL = 'gemini-2.0-flash'
const MAX_POSTS_TO_ANALYZE = 10  // daha az post → daha az istek
const BATCH_SIZE = 2             // paralel değil, 2'li sıralı
const BATCH_DELAY_MS = 4000      // 429 önlemek için batch arası 4s

// Singleton — API key kontrolü yapılır, bir kez oluşturulur
let _genAI: GoogleGenerativeAI | null = null

// Oturum bazlı önbellek — aynı post + expertise kombinasyonu tekrar sorgulanmaz
const _cache = new Map<string, AIMatchSuggestion | null>()

function getGenAI(): GoogleGenerativeAI | null {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null
  if (!_genAI) _genAI = new GoogleGenerativeAI(apiKey)
  return _genAI
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIMatchSuggestion {
  reason: string
  score: number
  expertise: string[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseAIResponse(text: string): AIMatchSuggestion | null {
  const jsonMatch = text.match(/\{[\s\S]*?\}/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<AIMatchSuggestion>

    if (typeof parsed.score !== 'number' || typeof parsed.reason !== 'string') return null

    return {
      reason: parsed.reason.slice(0, 60).trim(),
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      expertise: Array.isArray(parsed.expertise) ? parsed.expertise : [],
    }
  } catch {
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Proje açıklaması ile kullanıcı uzmanlığı arasındaki semantik eşleşmeyi analiz eder.
 * API anahtarı yoksa veya hata oluşursa null döner (graceful degradation).
 */
export async function analyzeProjectMatch(
  postDescription: string,
  userExpertise: string[],
): Promise<AIMatchSuggestion | null> {
  const ai = getGenAI()
  if (!ai || !userExpertise.length) return null

  // Cache key: description prefix + sorted tags
  const cacheKey = `${postDescription.slice(0, 80)}|${[...userExpertise].sort().join(',')}`
  if (_cache.has(cacheKey)) return _cache.get(cacheKey) ?? null

  try {
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL })

    const prompt = `You are a medical AI collaboration expert. Analyze semantic compatibility between a health-tech project and a user's expertise.

Project: ${postDescription}

User expertise: ${userExpertise.join(', ')}

Respond ONLY with valid JSON, no markdown:
{"reason":"Short match explanation (max 60 chars)","score":0-100,"expertise":["matching area 1"]}

If no meaningful match, return: {"reason":"","score":0,"expertise":[]}`

    const result = await model.generateContent(prompt)
    const parsed = parseAIResponse(result.response.text())
    _cache.set(cacheKey, parsed)
    return parsed
  } catch {
    return null
  }
}

/**
 * Kullanıcı profili ve post listesine göre AI destekli öneri haritası döner.
 * Sadece aktif postları, sadece başkasına ait olanları analiz eder (max 15).
 * Rate limit aşımını önlemek için batch'ler arasında 1s bekler.
 */
export async function getSmartSuggestions(
  user: User,
  posts: Post[],
): Promise<Map<string, AIMatchSuggestion>> {
  const suggestions = new Map<string, AIMatchSuggestion>()

  if (!user.expertiseTags?.length) return suggestions

  const candidates = posts
    .filter(p => p.authorId !== user.id && p.status === 'active')
    .slice(0, MAX_POSTS_TO_ANALYZE)

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)

    // Sıralı işleme — paralel değil, rate limit aşımını önler
    for (const post of batch) {
      const result = await analyzeProjectMatch(
        `${post.title}. ${post.description}. Required expertise: ${post.expertiseRequired}.`,
        user.expertiseTags ?? [],
      )
      if (result && result.score > 30) {
        suggestions.set(post.id, result)
      }
    }

    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return suggestions
}

/**
 * API çağrısı yapmadan keyword overlap'e dayalı basit skor (fallback).
 */
export function getSimpleMatchScore(post: Post, user: User): number {
  if (!user.expertiseTags?.length) return 0

  const haystack = `${post.title} ${post.description} ${post.expertiseRequired} ${post.domain}`.toLowerCase()
  const hits = (user.expertiseTags ?? []).filter(tag =>
    tag.length >= 2 && haystack.includes(tag.toLowerCase()),
  )

  return Math.min(100, hits.length * 25)
}

// ─── React hook ───────────────────────────────────────────────────────────────

export interface UseSmartSuggestionsReturn {
  suggestions: Map<string, AIMatchSuggestion>
  isLoading: boolean
  error: string | null
  load: (user: User, posts: Post[]) => Promise<void>
  reset: () => void
}

/**
 * Gemini destekli AI önerilerini yöneten hook.
 * Zustand store'larıyla birlikte kullanılabilir — loading state hook içinde tutulur.
 *
 * @example
 * const { suggestions, isLoading, load } = useSmartSuggestions()
 * useEffect(() => { load(user, posts) }, [user.id])
 */
export function useSmartSuggestions(): UseSmartSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<Map<string, AIMatchSuggestion>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (user: User, posts: Post[]) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSmartSuggestions(user, posts)
      setSuggestions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI suggestion failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSuggestions(new Map())
    setError(null)
  }, [])

  return { suggestions, isLoading, error, load, reset }
}
