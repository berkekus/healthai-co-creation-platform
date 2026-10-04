export interface MatchViewer { id: string; role: string; city?: string; country?: string; expertiseTags?: string[] }
export interface MatchablePost {
  authorId: string; authorRole: string; status: string; city?: string; country?: string
  title: string; expertiseRequired: string; description: string; domain?: string; domains?: string[]
}

const normalize = (value = '') => value.trim().toLowerCase()
const tokenize = (value: string) => normalize(value).split(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/i).filter(t => t.length >= 3)
const postDomains = (post: MatchablePost) => (post.domains?.length ? post.domains : post.domain ? [post.domain] : [])

function expertiseHits(post: MatchablePost, viewer: MatchViewer) {
  const haystack = normalize(`${post.title} ${post.expertiseRequired} ${post.description} ${postDomains(post).join(' ')}`)
  const haystackTokens = new Set(tokenize(haystack))
  return (viewer.expertiseTags ?? []).map(tag => tag.trim()).filter(tag => {
    if (tag.length < 2) return false
    if (haystack.includes(normalize(tag))) return true
    return tokenize(tag).some(token => haystackTokens.has(token))
  })
}

/** Rule-based relevance (0-82). Keep in step with frontend/src/utils/matchPosts.ts getCombinedMatchScore. */
export function matchScore(post: MatchablePost, viewer: MatchViewer): number {
  if (viewer.id === String(post.authorId) || post.status !== 'active') return 0
  let score = 0
  const sameCity = normalize(viewer.city) && normalize(viewer.city) === normalize(post.city)
  if (sameCity) score += 18
  else if (normalize(viewer.country) && normalize(viewer.country) === normalize(post.country)) score += 8

  const crossRole = (viewer.role === 'engineer' && post.authorRole === 'healthcare_professional')
    || (viewer.role === 'healthcare_professional' && post.authorRole === 'engineer')
  if (crossRole) score += 22

  const hits = expertiseHits(post, viewer)
  if (hits.length) score += Math.min(38, 14 + hits.length * 8)

  const expertiseTokens = new Set((viewer.expertiseTags ?? []).flatMap(tokenize))
  if (postDomains(post).flatMap(tokenize).some(t => expertiseTokens.has(t))) score += 12

  return Math.min(82, score)
}
