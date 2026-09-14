import { describe, it, expect } from 'vitest'
import { api, createUser, createPost, futureDate } from './helpers'
import Meeting from '../models/Meeting'
import Post from '../models/Post'

describe('GET /api/posts — draft scoping', () => {
  it('does not return drafts in the public feed', async () => {
    const { token } = await createUser()
    // createPost creates a draft by default
    const post = await createPost(token)
    expect(post.status).toBe('draft')

    const res = await api.get('/api/posts').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const ids = res.body.data.posts.map((p: { id: string }) => p.id)
    expect(ids).not.toContain(post.id)
  })

  it('returns own drafts when mine=true', async () => {
    const { token } = await createUser()
    const post = await createPost(token)

    const res = await api.get('/api/posts?mine=true').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const ids = res.body.data.posts.map((p: { id: string }) => p.id)
    expect(ids).toContain(post.id)
  })

  it('does not return another user\'s drafts in mine=true', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const post = await createPost(owner.token)

    const res = await api.get('/api/posts?mine=true').set('Authorization', `Bearer ${viewer.token}`)
    const ids = res.body.data.posts.map((p: { id: string }) => p.id)
    expect(ids).not.toContain(post.id)
  })

  it('does not expose a draft through its direct URL to another user', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const post = await createPost(owner.token)

    const res = await api.get(`/api/posts/${post.id}`).set('Authorization', `Bearer ${viewer.token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/posts — pagination', () => {
  it('returns pagination metadata', async () => {
    const { token } = await createUser()
    const res = await api.get('/api/posts?page=1&limit=5').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('total')
    expect(res.body.data).toHaveProperty('page', 1)
    expect(res.body.data).toHaveProperty('limit', 5)
    expect(res.body.data).toHaveProperty('pages')
    expect(Array.isArray(res.body.data.posts)).toBe(true)
  })
})

describe('PUT /api/posts/:id — field whitelist', () => {
  it('allows updating permitted fields', async () => {
    const { token } = await createUser()
    const post = await createPost(token)

    const res = await api
      .put(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated Title')
  })

  it('ignores attempts to mutate authorId', async () => {
    const { token, user } = await createUser()
    const post = await createPost(token)
    const originalAuthorId = post.authorId

    const res = await api
      .put(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ authorId: 'fakeid000000000000000000' })
    expect(res.status).toBe(200)
    expect(res.body.data.authorId).toBe(originalAuthorId ?? user.id)
  })

  it('ignores attempts to mutate status directly', async () => {
    const { token } = await createUser()
    const post = await createPost(token)

    const res = await api
      .put(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' })
    expect(res.status).toBe(200)
    // Status must still be draft — update endpoint cannot change it
    expect(res.body.data.status).toBe('draft')
  })

  it('returns 403 when non-author tries to update', async () => {
    const owner = await createUser()
    const other = await createUser()
    const post = await createPost(owner.token)

    const res = await api
      .put(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Hacked Title' })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/posts/:id/publish', () => {
  it('moves post from draft to active', async () => {
    const { token } = await createUser()
    const post = await createPost(token)

    const res = await api
      .post(`/api/posts/${post.id}/publish`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('active')
  })
})

// ─── Survey fixes: partner found is reversible, posts span several domains ──

async function publishedPost(overrides: Record<string, unknown> = {}) {
  const owner = await createUser({ role: 'healthcare_professional' })
  const post = await createPost(owner.token, overrides)
  await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
  return { owner, post }
}

async function requestOn(postId: string, days: number) {
  const requester = await createUser()
  const slot = { date: futureDate(days), time: '10:00' }
  const res = await api
    .post('/api/meetings')
    .set('Authorization', `Bearer ${requester.token}`)
    .send({
      postId,
      message: 'I am very interested in collaborating on this project with you.',
      ndaAccepted: true,
      proposedSlots: [slot],
    })
  return { requester, slot, meetingId: res.body.data.id as string }
}

describe('POST /api/posts/:id/partner-found', () => {
  it('closes open requests but keeps a meeting that is already scheduled', async () => {
    const { owner, post } = await publishedPost()
    const pending = await requestOn(post.id, 2)
    const choosing = await requestOn(post.id, 3)
    const scheduled = await requestOn(post.id, 4)
    const auth = { Authorization: `Bearer ${owner.token}` }
    await api.post(`/api/meetings/${choosing.meetingId}/accept`).set(auth)
    await api.post(`/api/meetings/${scheduled.meetingId}/accept`).set(auth)
    await api.post(`/api/meetings/${scheduled.meetingId}/confirm`).set(auth).send({ slot: scheduled.slot })

    const res = await api.post(`/api/posts/${post.id}/partner-found`).set(auth)
    expect(res.status).toBe(200)

    expect((await Meeting.findById(pending.meetingId))?.status).toBe('cancelled')
    expect((await Meeting.findById(choosing.meetingId))?.status).toBe('cancelled')
    expect((await Meeting.findById(scheduled.meetingId))?.status).toBe('confirmed')
  })

  it('refuses to mark a draft post as partner found', async () => {
    const owner = await createUser()
    const draft = await createPost(owner.token)
    const res = await api.post(`/api/posts/${draft.id}/partner-found`).set('Authorization', `Bearer ${owner.token}`)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/posts/:id/reopen', () => {
  it('lets the author reopen a post marked partner found', async () => {
    const { owner, post } = await publishedPost()
    await api.post(`/api/posts/${post.id}/partner-found`).set('Authorization', `Bearer ${owner.token}`)

    const res = await api.post(`/api/posts/${post.id}/reopen`).set('Authorization', `Bearer ${owner.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('active')
    expect((await Post.findById(post.id))?.status).toBe('active')
  })

  it('reopens as meeting scheduled when a confirmed meeting is still on the calendar', async () => {
    const { owner, post } = await publishedPost()
    const scheduled = await requestOn(post.id, 2)
    const auth = { Authorization: `Bearer ${owner.token}` }
    await api.post(`/api/meetings/${scheduled.meetingId}/accept`).set(auth)
    await api.post(`/api/meetings/${scheduled.meetingId}/confirm`).set(auth).send({ slot: scheduled.slot })
    await api.post(`/api/posts/${post.id}/partner-found`).set(auth)

    const res = await api.post(`/api/posts/${post.id}/reopen`).set(auth)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('meeting_scheduled')
  })

  it('returns 403 when someone else tries to reopen the post', async () => {
    const { owner, post } = await publishedPost()
    const other = await createUser()
    await api.post(`/api/posts/${post.id}/partner-found`).set('Authorization', `Bearer ${owner.token}`)

    const res = await api.post(`/api/posts/${post.id}/reopen`).set('Authorization', `Bearer ${other.token}`)
    expect(res.status).toBe(403)
    expect((await Post.findById(post.id))?.status).toBe('partner_found')
  })

  it('returns 400 for a post that is not closed', async () => {
    const { owner, post } = await publishedPost()
    const res = await api.post(`/api/posts/${post.id}/reopen`).set('Authorization', `Bearer ${owner.token}`)
    expect(res.status).toBe(400)
  })

  it('asks for a new expiry date when the closed post has already expired', async () => {
    const { owner, post } = await publishedPost()
    const auth = { Authorization: `Bearer ${owner.token}` }
    await api.post(`/api/posts/${post.id}/partner-found`).set(auth)
    await Post.updateOne({ _id: post.id }, { $set: { expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000) } })

    const withoutDate = await api.post(`/api/posts/${post.id}/reopen`).set(auth)
    expect(withoutDate.status).toBe(400)

    const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const withDate = await api.post(`/api/posts/${post.id}/reopen`).set(auth).send({ expiryDate: newExpiry })
    expect(withDate.status).toBe(200)
    expect(withDate.body.data.status).toBe('active')
    expect(new Date(withDate.body.data.expiryDate).toISOString()).toBe(newExpiry)
  })
})

describe('Post domains', () => {
  it('stores up to three domains and keeps the first one as the primary domain', async () => {
    const { token } = await createUser()
    const post = await createPost(token, { domain: undefined, domains: ['Midwifery', 'Maternal & Newborn Health', 'Nursing'] })
    expect(post.domains).toEqual(['Midwifery', 'Maternal & Newborn Health', 'Nursing'])
    expect(post.domain).toBe('Midwifery')
  })

  it('rejects a post with more than three domains', async () => {
    const { token } = await createUser()
    const res = await api
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Too broad',
        domain: 'Cardiology',
        domains: ['Cardiology', 'Oncology', 'Neurology', 'Nursing'],
        expertiseRequired: 'Machine Learning',
        description: 'A test post for integration tests.',
        projectStage: 'idea',
        collaborationType: 'research_partner',
        levelOfCommitment: 'flexible',
        confidentiality: 'public_pitch',
        city: 'Istanbul',
        country: 'Turkey',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    expect(res.status).toBe(400)
  })

  it('treats a single legacy domain as a one-item domain list', async () => {
    const { token } = await createUser()
    const post = await createPost(token, { domain: 'Cardiology' })
    expect(post.domains).toEqual(['Cardiology'])
  })

  it('replaces the domain list on update and re-derives the primary domain', async () => {
    const { token } = await createUser()
    const post = await createPost(token, { domain: 'Cardiology' })
    const res = await api
      .put(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ domains: ['Nursing', 'Palliative Care'] })
    expect(res.status).toBe(200)
    expect(res.body.data.domains).toEqual(['Nursing', 'Palliative Care'])
    expect(res.body.data.domain).toBe('Nursing')
  })

  it('finds a post by any of its domains', async () => {
    const { owner, post } = await publishedPost({ domain: undefined, domains: ['Obstetrics & Gynecology', 'Midwifery'] })
    const res = await api
      .get('/api/posts')
      .query({ domain: 'Midwifery' })
      .set('Authorization', `Bearer ${owner.token}`)
    expect(res.body.data.posts.map((p: { id: string }) => p.id)).toContain(post.id)
  })

  it('matches a post saved under a legacy duplicate domain name', async () => {
    const { owner, post } = await publishedPost({ domain: 'Radiology' })
    const res = await api
      .get('/api/posts')
      .query({ domain: 'Radiology & Imaging' })
      .set('Authorization', `Bearer ${owner.token}`)
    expect(res.body.data.posts.map((p: { id: string }) => p.id)).toContain(post.id)
  })

  it('filters by a domain name that contains brackets', async () => {
    const { owner, post } = await publishedPost({ domain: 'Intensive Care (ICU)' })
    const res = await api
      .get('/api/posts')
      .query({ domain: 'Intensive Care (ICU)' })
      .set('Authorization', `Bearer ${owner.token}`)
    expect(res.body.data.posts.map((p: { id: string }) => p.id)).toContain(post.id)
  })
})
