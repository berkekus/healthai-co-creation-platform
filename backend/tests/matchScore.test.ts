import { describe, it, expect } from 'vitest'
import { matchScore } from '../utils/matchScore'

const viewer = { id: 'me', role: 'engineer', city: 'Berlin', country: 'Germany', expertiseTags: ['machine learning', 'Cardiology'] }
const post = {
  authorId: 'other', authorRole: 'healthcare_professional', status: 'active', city: 'Berlin', country: 'Germany',
  title: 'ECG triage', expertiseRequired: 'Machine learning', description: 'Arrhythmia', domain: 'Cardiology', domains: ['Cardiology'],
}

describe('matchScore (mirrors frontend getCombinedMatchScore without AI)', () => {
  it('adds city, cross-role, expertise and domain points, capped at 82', () => {
    // 18 city + 22 cross-role + min(38, 14 + 2*8) expertise + 12 domain = 82 (cap)
    expect(matchScore(post, viewer)).toBe(82)
  })

  it("gives 0 for the viewer's own post or a non-active post", () => {
    expect(matchScore({ ...post, authorId: 'me' }, viewer)).toBe(0)
    expect(matchScore({ ...post, status: 'expired' }, viewer)).toBe(0)
  })

  it('counts country only when the city differs', () => {
    const unrelated = { ...post, city: 'Munich', title: 'x', expertiseRequired: 'x', description: 'x', domain: 'x', domains: ['x'] }
    expect(matchScore(unrelated, viewer)).toBe(8 + 22)
  })
})
