import { useCallback, useState } from 'react'
import type { Post } from '../types/post.types'
import type { User } from '../types/auth.types'
import api from './api'

export interface AIMatchSuggestion {
  postId?: string
  reason: string
  score: number
  expertise: string[]
}

const _cache = new Map<string, Map<string, AIMatchSuggestion>>()

function cacheKey(user: User, posts: Post[]) {
  const postKey = posts.map(post => `${post.id}:${post.updatedAt}`).join('|')
  return `${user.id}:${(user.expertiseTags ?? []).join(',')}:${postKey}`
}

export async function getSmartSuggestions(
  user: User,
  posts: Post[],
): Promise<Map<string, AIMatchSuggestion>> {
  if (!user.expertiseTags?.length && !user.bio) return new Map()

  const candidates = posts
    .filter(post => post.authorId !== user.id && post.status === 'active')
    .slice(0, 10)

  if (!candidates.length) return new Map()

  const key = cacheKey(user, candidates)
  const cached = _cache.get(key)
  if (cached) return cached

  const { data } = await api.post<{
    success: boolean
    data: { matches: Array<AIMatchSuggestion & { postId: string }> }
  }>('/ai/matches', {
    posts: candidates.map(post => ({
      id: post.id,
      title: post.title,
      domain: post.domain,
      expertiseRequired: post.expertiseRequired,
      description: post.description.slice(0, 500),
      authorId: post.authorId,
      authorRole: post.authorRole,
      city: post.city,
      country: post.country,
      status: post.status,
    })),
  })

  const suggestions = new Map<string, AIMatchSuggestion>()
  for (const match of data.data.matches) {
    suggestions.set(match.postId, {
      postId: match.postId,
      reason: match.reason,
      score: match.score,
      expertise: match.expertise,
    })
  }
  _cache.set(key, suggestions)
  return suggestions
}

export function getSimpleMatchScore(post: Post, user: User): number {
  if (!user.expertiseTags?.length) return 0

  const haystack = `${post.title} ${post.description} ${post.expertiseRequired} ${post.domain}`.toLowerCase()
  const hits = (user.expertiseTags ?? []).filter(tag =>
    tag.length >= 2 && haystack.includes(tag.toLowerCase()),
  )

  return Math.min(100, hits.length * 25)
}

export interface UseSmartSuggestionsReturn {
  suggestions: Map<string, AIMatchSuggestion>
  isLoading: boolean
  error: string | null
  load: (user: User, posts: Post[]) => Promise<void>
  reset: () => void
}

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
      setSuggestions(new Map())
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
