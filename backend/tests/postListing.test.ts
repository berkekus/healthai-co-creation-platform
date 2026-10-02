import { describe, it, expect } from 'vitest'
import { api, createUser, createPost, createPublishedPost, futureDate } from './helpers'
import User from '../models/User'

// Registration takes no expertise tags and requires a location, so viewer profiles are set on the raw collection.
async function setProfile(email: string, profile: { city?: string; country?: string; expertiseTags?: string[] }) {
  await User.collection.updateOne({ email: email.toLowerCase() }, { $set: profile })
}

const titles = (res: { body: { data: { posts: { title: string }[] } } }) => res.body.data.posts.map(p => p.title)

describe('GET /api/posts — server-side listing', () => {
  it('sorts by soonest expiry when sort=expiring', async () => {
    const { token } = await createUser()
    // Created first, so the default newest-first order would put it last.
    await createPublishedPost(token, { title: 'Soon', expiryDate: futureDate(10) })
    await createPublishedPost(token, { title: 'Late', expiryDate: futureDate(40) })

    const res = await api.get('/api/posts?sort=expiring&limit=10').set('Authorization', `Bearer ${token}`)
    expect(titles(res).indexOf('Soon')).toBeLessThan(titles(res).indexOf('Late'))
  })

  it('falls back to newest for an unknown sort instead of failing', async () => {
    const { token } = await createUser()
    const res = await api.get('/api/posts?sort=drop_table').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('finds partial words, case-insensitively, like the old in-browser search', async () => {
    const { token } = await createUser()
    await createPublishedPost(token, { title: 'Cardiology triage assistant' })
    await createPublishedPost(token, { title: 'Wound imaging' })

    const res = await api.get('/api/posts?search=CARDI').set('Authorization', `Bearer ${token}`)
    expect(titles(res)).toEqual(['Cardiology triage assistant'])
  })

  it('matches location against city or country, together with a domain filter', async () => {
    const { token } = await createUser()
    await createPublishedPost(token, { title: 'Berlin cardio', city: 'Berlin', country: 'Germany', domain: 'Cardiology' })
    await createPublishedPost(token, { title: 'Berlin neuro', city: 'Berlin', country: 'Germany', domain: 'Neurology' })
    await createPublishedPost(token, { title: 'Ankara cardio', city: 'Ankara', country: 'Turkey', domain: 'Cardiology' })

    const res = await api.get('/api/posts?location=germ&domain=Cardiology').set('Authorization', `Bearer ${token}`)
    expect(titles(res)).toEqual(['Berlin cardio'])
  })

  it('never repeats or drops a post across pages', async () => {
    const { token } = await createUser()
    for (const n of [1, 2, 3, 4, 5]) await createPublishedPost(token, { title: `Paged ${n}` })

    const page1 = await api.get('/api/posts?search=Paged&limit=2&page=1').set('Authorization', `Bearer ${token}`)
    const page2 = await api.get('/api/posts?search=Paged&limit=2&page=2').set('Authorization', `Bearer ${token}`)
    const page3 = await api.get('/api/posts?search=Paged&limit=2&page=3').set('Authorization', `Bearer ${token}`)
    const all = [...titles(page1), ...titles(page2), ...titles(page3)]
    expect(new Set(all).size).toBe(5)
    expect(page1.body.data.total).toBe(5)
  })

  it('ignores query operators smuggled in as objects, so other people’s drafts stay hidden', async () => {
    // qs turns status[$exists]=true into { $exists: true }; as a filter that would match drafts too.
    const author = await createUser()
    await createPost(author.token, { title: 'Someone else’s draft' })
    const viewer = await createUser()

    const res = await api.get('/api/posts?status[$exists]=true').set('Authorization', `Bearer ${viewer.token}`)
    expect(res.status).toBe(200)
    expect(titles(res)).not.toContain('Someone else’s draft')
  })
})

describe('GET /api/posts?sort=relevance', () => {
  it('ranks the best match first even when it is older', async () => {
    const author = await createUser({ role: 'healthcare_professional' })
    await createPublishedPost(author.token, { title: 'Strong match', city: 'Berlin', country: 'Germany', domain: 'Cardiology', expertiseRequired: 'Machine learning' })
    await createPublishedPost(author.token, { title: 'Weak match', city: 'Lima', country: 'Peru', domain: 'Dermatology', expertiseRequired: 'Pottery' })
    const viewer = await createUser({ role: 'engineer' })
    await setProfile(viewer.email, { city: 'Berlin', country: 'Germany', expertiseTags: ['machine learning'] })

    const res = await api.get('/api/posts?sort=relevance').set('Authorization', `Bearer ${viewer.token}`)
    expect(titles(res)[0]).toBe('Strong match')
    expect(res.body.data.posts[0].matchScore).toBeGreaterThan(res.body.data.posts[1].matchScore)
  })

  it('falls back to newest for a viewer with no profile to match against', async () => {
    const author = await createUser()
    await createPublishedPost(author.token, { title: 'Older fallback' })
    await createPublishedPost(author.token, { title: 'Newer fallback' })
    const viewer = await createUser()
    await setProfile(viewer.email, { city: '', country: '', expertiseTags: [] })

    const res = await api.get('/api/posts?sort=relevance&search=fallback').set('Authorization', `Bearer ${viewer.token}`)
    expect(res.status).toBe(200)
    expect(titles(res)).toEqual(['Newer fallback', 'Older fallback'])
    expect(res.body.data.posts[0].matchScore).toBeUndefined()
  })
})
