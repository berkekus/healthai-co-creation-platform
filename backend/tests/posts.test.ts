import { describe, it, expect } from 'vitest'
import { api, createUser, createPost } from './helpers'

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
