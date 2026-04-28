import { describe, it, expect } from 'vitest'
import { api, createUser, createPost } from './helpers'

async function requestMeeting(
  requesterToken: string,
  postId: string,
  postTitle: string,
  ownerId: string,
  ownerName: string,
) {
  return api
    .post('/api/meetings')
    .set('Authorization', `Bearer ${requesterToken}`)
    .send({
      postId,
      postTitle,
      ownerId,
      ownerName,
      message: 'I am very interested in collaborating on this project with you.',
      ndaAccepted: true,
      proposedSlots: [
        { date: '2026-05-01', time: '10:00' },
        { date: '2026-05-02', time: '11:00' },
        { date: '2026-05-03', time: '14:00' },
      ],
    })
}

describe('POST /api/meetings', () => {
  it('creates a meeting request successfully', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)

    // Publish the post so it can receive meetings
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    const res = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('pending')
  })

  it('returns 409 when requester already has a pending meeting for the same post', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const res = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    expect(res.status).toBe(409)
  })

  it('returns 400 when ownerId does not match post author', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    const res = await requestMeeting(requester.token, post.id, post.title, requester.user.id, requester.user.name)
    expect(res.status).toBe(400)
  })

  it('returns 400 when NDA is not accepted', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    const res = await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${requester.token}`)
      .send({
        postId: post.id,
        postTitle: post.title,
        ownerId: owner.user.id,
        ownerName: owner.user.name,
        message: 'I am interested in collaborating on this great project.',
        ndaAccepted: false,
        proposedSlots: [
          { date: '2026-05-01', time: '10:00' },
          { date: '2026-05-02', time: '11:00' },
          { date: '2026-05-03', time: '14:00' },
        ],
      })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/meetings/:id/decline', () => {
  it('declines a pending meeting', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const meetingId = meetingRes.body.data.id

    const res = await api
      .post(`/api/meetings/${meetingId}/decline`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('declined')
  })

  it('returns 400 when meeting is already declined', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const meetingId = meetingRes.body.data.id

    await api.post(`/api/meetings/${meetingId}/decline`).set('Authorization', `Bearer ${owner.token}`)
    const res = await api
      .post(`/api/meetings/${meetingId}/decline`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(res.status).toBe(400)
  })
})

describe('Concurrent accept race condition', () => {
  it('only one of two simultaneous accept requests succeeds', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const meetingId = meetingRes.body.data.id
    const slot = { date: '2026-06-01', time: '10:00' }

    // Fire two accept requests simultaneously
    const [r1, r2] = await Promise.all([
      api.post(`/api/meetings/${meetingId}/accept`).set('Authorization', `Bearer ${owner.token}`).send({ slot }),
      api.post(`/api/meetings/${meetingId}/accept`).set('Authorization', `Bearer ${owner.token}`).send({ slot }),
    ])

    const statuses = [r1.status, r2.status].sort()
    // One must succeed (200), the other must fail (400 — already confirmed)
    expect(statuses).toEqual([200, 400])
  })
})

describe('POST /api/meetings/:id/cancel', () => {
  it('cancels a pending meeting', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const meetingId = meetingRes.body.data.id

    const res = await api
      .post(`/api/meetings/${meetingId}/cancel`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('cancelled')
  })

  it('returns 400 when meeting is already cancelled', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const meetingId = meetingRes.body.data.id

    await api.post(`/api/meetings/${meetingId}/cancel`).set('Authorization', `Bearer ${requester.token}`)
    const res = await api
      .post(`/api/meetings/${meetingId}/cancel`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(res.status).toBe(400)
  })

  it('returns 400 when trying to cancel a declined meeting', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id, post.title, owner.user.id, owner.user.name)
    const meetingId = meetingRes.body.data.id

    await api.post(`/api/meetings/${meetingId}/decline`).set('Authorization', `Bearer ${owner.token}`)
    const res = await api
      .post(`/api/meetings/${meetingId}/cancel`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(res.status).toBe(400)
  })
})
