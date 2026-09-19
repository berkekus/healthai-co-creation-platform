import { describe, it, expect } from 'vitest'
import { api, createUser, createPost, futureDate } from './helpers'
import Meeting from '../models/Meeting'
import Post from '../models/Post'

async function requestMeeting(requesterToken: string, postId: string) {
  return api
    .post('/api/meetings')
    .set('Authorization', `Bearer ${requesterToken}`)
    .send({
      postId,
      message: 'I am very interested in collaborating on this project with you.',
      ndaAccepted: true,
      proposedSlots: [
        { date: futureDate(2), time: '10:00' },
        { date: futureDate(3), time: '11:00' },
        { date: futureDate(4), time: '14:00' },
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

    const res = await requestMeeting(requester.token, post.id)
    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('pending')
  })

  it('rejects incomplete, duplicate, or past proposed slots', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    const duplicateDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const duplicateRes = await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${requester.token}`)
      .send({
        postId: post.id,
        message: 'I am very interested in collaborating on this project with you.',
        ndaAccepted: true,
        proposedSlots: [
          { date: duplicateDate, time: '10:00' },
          { date: duplicateDate, time: '10:00' },
          { date: duplicateDate, time: '11:00' },
        ],
      })
    expect(duplicateRes.status).toBe(400)

    const invalidRes = await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${requester.token}`)
      .send({
        postId: post.id,
        message: 'I am very interested in collaborating on this project with you.',
        ndaAccepted: true,
        proposedSlots: [{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }],
      })
    expect(invalidRes.status).toBe(400)
  })

  it('returns 409 when requester already has a pending meeting for the same post', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)

    await requestMeeting(requester.token, post.id)
    const res = await requestMeeting(requester.token, post.id)
    expect(res.status).toBe(409)
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
        message: 'I am interested in collaborating on this great project.',
        ndaAccepted: false,
        proposedSlots: [
          { date: futureDate(2), time: '10:00' },
          { date: futureDate(3), time: '11:00' },
          { date: futureDate(4), time: '14:00' },
        ],
      })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/meetings/:id', () => {
  it('does not expose a meeting to an unrelated user', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const outsider = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meeting = await requestMeeting(requester.token, post.id)

    const res = await api
      .get(`/api/meetings/${meeting.body.data.id}`)
      .set('Authorization', `Bearer ${outsider.token}`)
    expect(res.status).toBe(403)
  })
})

describe('POST /api/meetings/:id/decline', () => {
  it('declines a pending meeting', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const requester = await createUser()
    const post = await createPost(owner.token)
    await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    const meetingRes = await requestMeeting(requester.token, post.id)
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
    const meetingRes = await requestMeeting(requester.token, post.id)
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
    const meetingRes = await requestMeeting(requester.token, post.id)
    const meetingId = meetingRes.body.data.id
    const slot = { date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), time: '10:00' }

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
    const meetingRes = await requestMeeting(requester.token, post.id)
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
    const meetingRes = await requestMeeting(requester.token, post.id)
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
    const meetingRes = await requestMeeting(requester.token, post.id)
    const meetingId = meetingRes.body.data.id

    await api.post(`/api/meetings/${meetingId}/decline`).set('Authorization', `Bearer ${owner.token}`)
    const res = await api
      .post(`/api/meetings/${meetingId}/cancel`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(res.status).toBe(400)
  })
})

// ─── Survey fixes: slots, time zones, chat on accept, held is not partner found

async function publishedPostWithOwner() {
  const owner = await createUser({ role: 'healthcare_professional' })
  const post = await createPost(owner.token)
  await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
  return { owner, post }
}

function threeSlots() {
  return [2, 3, 4].map(day => ({ date: futureDate(day), time: '10:00' }))
}

function sendRequest(token: string, postId: string, proposedSlots: unknown[]) {
  return api
    .post('/api/meetings')
    .set('Authorization', `Bearer ${token}`)
    .send({
      postId,
      message: 'I am very interested in collaborating on this project with you.',
      ndaAccepted: true,
      proposedSlots,
    })
}

describe('POST /api/meetings — proposed slot count', () => {
  it('accepts a request with a single proposed slot', async () => {
    const { post } = await publishedPostWithOwner()
    const requester = await createUser()
    const res = await sendRequest(requester.token, post.id, [{ date: futureDate(2), time: '10:00' }])
    expect(res.status).toBe(201)
    expect(res.body.data.proposedSlots).toHaveLength(1)
  })

  it('rejects a request with no proposed slot', async () => {
    const { post } = await publishedPostWithOwner()
    const requester = await createUser()
    const res = await sendRequest(requester.token, post.id, [])
    expect(res.status).toBe(400)
  })

  it('rejects a request with more than five proposed slots', async () => {
    const { post } = await publishedPostWithOwner()
    const requester = await createUser()
    const slots = [2, 3, 4, 5, 6, 7].map(day => ({ date: futureDate(day), time: '09:00' }))
    const res = await sendRequest(requester.token, post.id, slots)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/meetings — slot time zones', () => {
  it('stores the IANA time zone a slot was proposed in', async () => {
    const { post } = await publishedPostWithOwner()
    const requester = await createUser()
    const res = await sendRequest(requester.token, post.id, [
      { date: futureDate(2), time: '10:00', timezone: 'Europe/Lisbon' },
    ])
    expect(res.status).toBe(201)
    expect(res.body.data.proposedSlots[0].timezone).toBe('Europe/Lisbon')
  })

  it('rejects a slot with an unknown time zone', async () => {
    const { post } = await publishedPostWithOwner()
    const requester = await createUser()
    const res = await sendRequest(requester.token, post.id, [
      { date: futureDate(2), time: '10:00', timezone: 'Mars/Olympus_Mons' },
      { date: futureDate(3), time: '10:00' },
      { date: futureDate(4), time: '10:00' },
    ])
    expect(res.status).toBe(400)
  })

  it('confirms the proposed slot together with its time zone', async () => {
    const { owner, post } = await publishedPostWithOwner()
    const requester = await createUser()
    const slot = { date: futureDate(3), time: '15:30', timezone: 'Europe/Istanbul' }
    const meeting = (await sendRequest(requester.token, post.id, [slot])).body.data
    await api.post(`/api/meetings/${meeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)

    const res = await api
      .post(`/api/meetings/${meeting.id}/confirm`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ slot: { date: slot.date, time: slot.time } })
    expect(res.status).toBe(200)
    expect(res.body.data.confirmedSlot).toMatchObject(slot)
  })
})

describe('Meeting chat availability', () => {
  it('opens the conversation as soon as the owner accepts the request', async () => {
    const { owner, post } = await publishedPostWithOwner()
    const requester = await createUser()
    const meeting = (await sendRequest(requester.token, post.id, [{ date: futureDate(2), time: '10:00' }])).body.data

    const before = await api
      .get(`/api/conversations/by-meeting/${meeting.id}`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(before.status).toBe(404)

    const accepted = await api.post(`/api/meetings/${meeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)
    expect(accepted.status).toBe(200)

    const after = await api
      .get(`/api/conversations/by-meeting/${meeting.id}`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(after.status).toBe(200)
    expect(after.body.data.participants.map(String)).toEqual(
      expect.arrayContaining([owner.user.id, requester.user.id]),
    )
  })

  it('creates the missing conversation for a meeting accepted before chats opened on accept', async () => {
    const { post } = await publishedPostWithOwner()
    const requester = await createUser()
    const meeting = (await sendRequest(requester.token, post.id, [{ date: futureDate(2), time: '10:00' }])).body.data
    await Meeting.updateOne({ _id: meeting.id }, { $set: { status: 'time_proposed' } })

    const res = await api
      .get(`/api/conversations/by-meeting/${meeting.id}`)
      .set('Authorization', `Bearer ${requester.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.meetingId).toBe(meeting.id)
  })

  it('does not open a conversation for an outsider', async () => {
    const { owner, post } = await publishedPostWithOwner()
    const requester = await createUser()
    const outsider = await createUser()
    const meeting = (await sendRequest(requester.token, post.id, [{ date: futureDate(2), time: '10:00' }])).body.data
    await api.post(`/api/meetings/${meeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)

    const res = await api
      .get(`/api/conversations/by-meeting/${meeting.id}`)
      .set('Authorization', `Bearer ${outsider.token}`)
    expect(res.status).toBe(403)
  })
})

async function confirmedMeeting() {
  const { owner, post } = await publishedPostWithOwner()
  const requester = await createUser()
  const slot = { date: futureDate(2), time: '10:00' }
  const meeting = (await sendRequest(requester.token, post.id, [slot])).body.data
  await api.post(`/api/meetings/${meeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)
  await api.post(`/api/meetings/${meeting.id}/confirm`).set('Authorization', `Bearer ${owner.token}`).send({ slot })
  return { owner, requester, post, meeting }
}

describe('POST /api/meetings/:id/complete — marking a meeting as held', () => {
  it('does not close the post when the requester marks the meeting as held', async () => {
    const { requester, post, meeting } = await confirmedMeeting()

    const res = await api.post(`/api/meetings/${meeting.id}/complete`).set('Authorization', `Bearer ${requester.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('completed')

    expect((await Post.findById(post.id))?.status).toBe('active')
  })

  it('leaves other open requests for the post untouched', async () => {
    const { owner, post, meeting } = await confirmedMeeting()
    const other = await createUser()
    const otherRequest = (await sendRequest(other.token, post.id, [{ date: futureDate(4), time: '12:00' }])).body.data

    await api.post(`/api/meetings/${meeting.id}/complete`).set('Authorization', `Bearer ${owner.token}`)

    expect((await Meeting.findById(otherRequest.id))?.status).toBe('pending')
  })
})

describe('Several candidates for one post', () => {
  it('keeps other requests open when one request gets a confirmed slot', async () => {
    const { owner, post } = await publishedPostWithOwner()
    const first = await createUser()
    const second = await createUser()
    const slot = { date: futureDate(2), time: '10:00' }
    const firstMeeting = (await sendRequest(first.token, post.id, [slot])).body.data
    const secondMeeting = (await sendRequest(second.token, post.id, [{ date: futureDate(3), time: '11:00' }])).body.data

    await api.post(`/api/meetings/${firstMeeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)
    const confirmed = await api
      .post(`/api/meetings/${firstMeeting.id}/confirm`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ slot })
    expect(confirmed.status).toBe(200)

    expect((await Meeting.findById(secondMeeting.id))?.status).toBe('pending')
  })

  it('still accepts new requests while the post has a scheduled meeting', async () => {
    const { post } = await confirmedMeeting()
    expect((await Post.findById(post.id))?.status).toBe('meeting_scheduled')

    const newcomer = await createUser()
    const res = await sendRequest(newcomer.token, post.id, [{ date: futureDate(5), time: '09:30' }])
    expect(res.status).toBe(201)
  })
})

describe('POST /api/meetings — closed posts and duplicates', () => {
  it('rejects a request for a post whose partner has been found', async () => {
    const { owner, post } = await publishedPostWithOwner()
    await api.post(`/api/posts/${post.id}/partner-found`).set('Authorization', `Bearer ${owner.token}`)

    const requester = await createUser()
    const res = await sendRequest(requester.token, post.id, threeSlots())
    expect(res.status).toBe(400)
  })

  it('rejects a request for a draft post', async () => {
    const owner = await createUser({ role: 'healthcare_professional' })
    const draft = await createPost(owner.token)
    const requester = await createUser()
    const res = await sendRequest(requester.token, draft.id, threeSlots())
    expect(res.status).toBe(400)
  })

  it('returns 409 when the requester already has an accepted request for the post', async () => {
    const { owner, post } = await publishedPostWithOwner()
    const requester = await createUser()
    const meeting = (await sendRequest(requester.token, post.id, [{ date: futureDate(2), time: '10:00' }])).body.data
    await api.post(`/api/meetings/${meeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)

    const again = await sendRequest(requester.token, post.id, [{ date: futureDate(3), time: '10:00' }])
    expect(again.status).toBe(409)
  })
})

describe('POST /api/meetings/:id/reschedule — proposing new times', () => {
  it('lets the requester replace the proposed times while the owner is still choosing', async () => {
    const { owner, post } = await publishedPostWithOwner()
    const requester = await createUser()
    const meeting = (await sendRequest(requester.token, post.id, [{ date: futureDate(2), time: '10:00' }])).body.data
    await api.post(`/api/meetings/${meeting.id}/accept`).set('Authorization', `Bearer ${owner.token}`)

    const newSlots = [{ date: futureDate(6), time: '16:00' }, { date: futureDate(7), time: '08:15' }]
    const res = await api
      .post(`/api/meetings/${meeting.id}/reschedule`)
      .set('Authorization', `Bearer ${requester.token}`)
      .send({ proposedSlots: newSlots })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('time_proposed')
    expect(res.body.data.proposedSlots).toEqual(newSlots)
  })
})

describe('GET /api/meetings — post status', () => {
  it('tells both sides that the post has been closed with Partner Found', async () => {
    const { owner, requester, post, meeting } = await confirmedMeeting()
    await api.post(`/api/meetings/${meeting.id}/complete`).set('Authorization', `Bearer ${owner.token}`)
    await api.post(`/api/posts/${post.id}/partner-found`).set('Authorization', `Bearer ${owner.token}`)

    for (const viewer of [owner, requester]) {
      const res = await api.get('/api/meetings').set('Authorization', `Bearer ${viewer.token}`)
      expect(res.status).toBe(200)
      expect(res.body.data.find((m: { id: string }) => m.id === meeting.id)?.postStatus).toBe('partner_found')
    }
  })
})
