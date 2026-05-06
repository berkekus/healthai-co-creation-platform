import { describe, it, expect } from 'vitest'
import { api, createUser, createPost } from './helpers'
import User from '../models/User'

// ─── Posts: cross-user authorization ────────────────────────────────────────

describe('POST authorization — delete post', () => {
  it('returns 403 when non-author tries to delete another user\'s post', async () => {
    const owner = await createUser()
    const other = await createUser()
    const post = await createPost(owner.token)

    const res = await api
      .delete(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${other.token}`)
    expect(res.status).toBe(403)
  })

  it('allows the author to delete their own post', async () => {
    const owner = await createUser()
    const post = await createPost(owner.token)

    const res = await api
      .delete(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(res.status).toBe(200)
  })
})

describe('POST authorization — publish post', () => {
  it('returns 403 when non-author tries to publish another user\'s post', async () => {
    const owner = await createUser()
    const other = await createUser()
    const post = await createPost(owner.token)

    const res = await api
      .post(`/api/posts/${post.id}/publish`)
      .set('Authorization', `Bearer ${other.token}`)
    expect(res.status).toBe(403)
  })
})

describe('POST authorization — mark partner found', () => {
  it('returns 403 when non-author tries to mark partner found', async () => {
    const owner = await createUser()
    const other = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    const res = await api
      .post(`/api/posts/${post.id}/partner-found`)
      .set('Authorization', `Bearer ${other.token}`)
    expect(res.status).toBe(403)
  })

  it('cancels pending meetings when owner marks partner found', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    const meetingRes = await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${requester.token}`)
      .send({
        postId: post.id,
        message: 'I am very interested in collaborating on this project with you.',
        ndaAccepted: true,
        proposedSlots: [
          { date: '2026-07-01', time: '10:00' },
          { date: '2026-07-02', time: '11:00' },
          { date: '2026-07-03', time: '14:00' },
        ],
      })
    expect(meetingRes.status).toBe(201)
    const meetingId = meetingRes.body.data.id

    await api
      .post(`/api/posts/${post.id}/partner-found`)
      .set('Authorization', `Bearer ${owner.token}`)

    const meetingCheck = await api
      .get(`/api/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(meetingCheck.body.data.status).toBe('cancelled')
  })
})

// ─── Notifications: spam protection ─────────────────────────────────────────

describe('POST /api/notifications — admin-only protection', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await api.post('/api/notifications').send({
      userId: 'someuserid',
      type: 'account_activity',
      title: 'Spam',
      body: 'Spam body',
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when authenticated non-admin tries to create notification', async () => {
    const user = await createUser()
    const target = await createUser()

    const res = await api
      .post('/api/notifications')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        userId: target.user.id,
        type: 'account_activity',
        title: 'Spam',
        body: 'Spam body',
      })
    expect(res.status).toBe(403)
  })

  it('returns 201 when admin creates a notification', async () => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser()

    // Promote user to admin directly in DB (role enum enforced at register)
    await User.findByIdAndUpdate(admin.user.id, { role: 'admin' })
    const adminLogin = await api.post('/api/auth/login').send({ email: admin.email, password: admin.password })
    const adminToken = adminLogin.body.data.token

    const res = await api
      .post('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: target.user.id,
        type: 'account_activity',
        title: 'System notice',
        body: 'This is a system notification.',
      })
    expect(res.status).toBe(201)
  })
})

// ─── User profile: data leak prevention ──────────────────────────────────────

describe('GET /api/auth/users/:id — public profile data', () => {
  it('does not expose email of another user', async () => {
    const owner = await createUser()
    const viewer = await createUser()

    const res = await api
      .get(`/api/auth/users/${owner.user.id}`)
      .set('Authorization', `Bearer ${viewer.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).not.toHaveProperty('email')
    expect(res.body.data).not.toHaveProperty('isVerified')
    expect(res.body.data).not.toHaveProperty('isSuspended')
  })

  it('returns public fields for another user', async () => {
    const owner = await createUser()
    const viewer = await createUser()

    const res = await api
      .get(`/api/auth/users/${owner.user.id}`)
      .set('Authorization', `Bearer ${viewer.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('name')
    expect(res.body.data).toHaveProperty('role')
    expect(res.body.data).toHaveProperty('institution')
  })
})

// ─── Notifications: pagination ───────────────────────────────────────────────

describe('GET /api/notifications — pagination', () => {
  it('returns pagination metadata', async () => {
    const user = await createUser()

    const res = await api
      .get('/api/notifications?page=1&limit=10')
      .set('Authorization', `Bearer ${user.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('total')
    expect(res.body.data).toHaveProperty('page', 1)
    expect(res.body.data).toHaveProperty('limit', 10)
    expect(res.body.data).toHaveProperty('pages')
    expect(Array.isArray(res.body.data.notifications)).toBe(true)
  })

  it('filters by isRead=false', async () => {
    const user = await createUser()

    const res = await api
      .get('/api/notifications?isRead=false')
      .set('Authorization', `Bearer ${user.token}`)
    expect(res.status).toBe(200)
    const notifications = res.body.data.notifications as Array<{ isRead: boolean }>
    expect(notifications.every(n => n.isRead === false)).toBe(true)
  })
})
