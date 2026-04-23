import type { Post } from '../types/post.types'
import type { User } from '../types/auth.types'
import { getSimpleMatchScore, type AIMatchSuggestion } from '../lib/gemini'

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
  const userCity    = user.city.trim().toLowerCase()
  const userCountry = user.country.trim().toLowerCase()
  const postCity    = post.city.trim().toLowerCase()
  const postCountry = post.country.trim().toLowerCase()

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
    const haystack = `${post.expertiseRequired} ${post.description} ${post.domain}`.toLowerCase()
    const hits = user.expertiseTags
      .map(t => t.trim())
      .filter(t => t.length >= 2 && haystack.includes(t.toLowerCase()))
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
  // Base score from reason count
  const baseScore = computeMatchReasons(post, user).length * 20
  
  // Add AI score if available
  const aiBonus = aiScore || 0
  
  return Math.min(100, baseScore + aiBonus)
}
