import type { Post } from '../types/post.types'
import type { User } from '../types/auth.types'
import type { AIMatchSuggestion } from '../lib/gemini'

export type MatchTone = 'city' | 'country' | 'role' | 'expertise' | 'domain'

export interface MatchReason {
  /** Short label to display on a chip, e.g. "In Berlin" */
  label: string
  /** Material Symbols icon name */
  icon: string
  /** Color tone, consumer maps to hai-* classes */
  tone: MatchTone
  /** AI-generated reason (optional) */
  isAI?: boolean
}

const normalize = (value: string) => value.trim().toLowerCase()

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/i)
    .filter(token => token.length >= 3)
}

function expertiseHits(post: Post, user: User) {
  const haystack = normalize(`${post.title} ${post.expertiseRequired} ${post.description} ${post.domain}`)
  const haystackTokens = new Set(tokenize(haystack))

  return (user.expertiseTags ?? [])
    .map(tag => tag.trim())
    .filter(tag => {
      if (tag.length < 2) return false
      const normalizedTag = normalize(tag)
      if (haystack.includes(normalizedTag)) return true
      return tokenize(tag).some(token => haystackTokens.has(token))
    })
}

/**
 * Compute "why this post matches you" reasons, used for:
 *   - per-card match chips
 *   - ranking the "Best matches for you" featured row
 *
 * Returns an empty array when no user is logged in (or the user is the author
 * of the post — we never advertise a user's own post as a match).
 */
export function computeMatchReasons(post: Post, user: User | null | undefined): MatchReason[] {
  if (!user || user.id === post.authorId) return []

  const reasons: MatchReason[] = []
  const userCity    = normalize(user.city)
  const userCountry = normalize(user.country)
  const postCity    = normalize(post.city)
  const postCountry = normalize(post.country)

  // Location
  if (userCity && userCity === postCity) {
    reasons.push({ label: `In ${post.city}`, icon: 'near_me', tone: 'city' })
  } else if (userCountry && userCountry === postCountry) {
    reasons.push({ label: `In ${post.country}`, icon: 'public', tone: 'country' })
  }

  // Cross-role matching (core platform value)
  if (user.role === 'engineer' && post.authorRole === 'healthcare_professional') {
    reasons.push({ label: 'Needs engineering', icon: 'memory', tone: 'role' })
  } else if (user.role === 'healthcare_professional' && post.authorRole === 'engineer') {
    reasons.push({ label: 'Needs clinical input', icon: 'stethoscope', tone: 'role' })
  }

  // Expertise tag overlap vs expertiseRequired text
  if (user.expertiseTags?.length) {
    const hits = expertiseHits(post, user)
    if (hits.length > 0) {
      const preview = hits.slice(0, 2).join(' · ')
      reasons.push({
        label: hits.length > 2 ? `${preview} +${hits.length - 2}` : preview,
        icon: 'auto_awesome',
        tone: 'expertise',
      })
    }
  }

  return reasons
}

/**
 * Sort posts by match strength (descending). Posts with more match reasons come
 * first; ties break by recency (createdAt desc).
 */
export function rankByMatch(
  posts: Post[],
  user: User | null | undefined,
): { post: Post; reasons: MatchReason[] }[] {
  return posts
    .map(post => ({ post, reasons: computeMatchReasons(post, user) }))
    .sort((a, b) => {
      if (b.reasons.length !== a.reasons.length) return b.reasons.length - a.reasons.length
      return new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime()
    })
}

/**
 * Enhanced match reasons with AI scoring (Gemini API)
 * This adds AI-generated match reasons on top of the basic matching
 */
export function computeEnhancedMatchReasons(
  post: Post,
  user: User | null | undefined,
  aiSuggestion?: AIMatchSuggestion | null,
): MatchReason[] {
  // Start with basic reasons
  const reasons = computeMatchReasons(post, user)
  
  // Add AI reason if available and has good score
  if (aiSuggestion && aiSuggestion.score > 30 && aiSuggestion.reason) {
    reasons.push({
      label: aiSuggestion.reason,
      icon: 'psychology',
      tone: 'expertise',
      isAI: true,
    })
  }
  
  return reasons
}

/**
 * Get combined match score (basic + AI)
 */
export function getCombinedMatchScore(
  post: Post,
  user: User | null | undefined,
  aiScore?: number,
): number {
  if (!user || user.id === post.authorId || post.status !== 'active') return 0

  let baseScore = 0

  const userCity = normalize(user.city)
  const userCountry = normalize(user.country)
  const postCity = normalize(post.city)
  const postCountry = normalize(post.country)

  if (userCity && userCity === postCity) {
    baseScore += 18
  } else if (userCountry && userCountry === postCountry) {
    baseScore += 8
  }

  const crossRole =
    (user.role === 'engineer' && post.authorRole === 'healthcare_professional') ||
    (user.role === 'healthcare_professional' && post.authorRole === 'engineer')
  if (crossRole) baseScore += 22

  const hits = expertiseHits(post, user)
  if (hits.length > 0) {
    baseScore += Math.min(38, 14 + hits.length * 8)
  }

  const domainTokens = tokenize(post.domain)
  const expertiseTokens = new Set((user.expertiseTags ?? []).flatMap(tokenize))
  if (domainTokens.some(token => expertiseTokens.has(token))) {
    baseScore += 12
  }

  baseScore = Math.min(82, baseScore)

  if (typeof aiScore === 'number' && aiScore > 0) {
    return Math.min(100, Math.round(baseScore * 0.45 + aiScore * 0.55))
  }

  return Math.round(baseScore)
}
