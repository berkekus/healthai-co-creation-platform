import { describe, it, expect } from 'vitest'
import { api, createUser, createPost } from './helpers'
import Notification from '../models/Notification'

async function publishedPost() {
  const owner = await createUser({ role: 'healthcare_professional' })
  const post = await createPost(owner.token, { title: 'Wearable ECG triage' })
  await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
  return { owner, post }
}

function comment(token: string, postId: string, content: string, parentId?: string) {
  return api
    .post(`/api/posts/${postId}/comments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content, ...(parentId ? { parentId } : {}) })
}

describe('POST /api/posts/:id/comments — notifications', () => {
  it('notifies the post author when someone else comments', async () => {
    const { owner, post } = await publishedPost()
    const visitor = await createUser()

    const res = await comment(visitor.token, post.id, 'Is this still open to engineers from Portugal?')
    expect(res.status).toBe(201)

    const notices = await Notification.find({ userId: owner.user.id })
    expect(notices).toHaveLength(1)
    expect(notices[0].type).toBe('new_comment')
    expect(notices[0].contentKey).toBe('new_comment')
    expect(notices[0].metadata).toMatchObject({ actorName: 'Test User', postTitle: 'Wearable ECG triage' })
    expect(notices[0].linkTo).toBe(`/posts/${post.id}#comments`)
  })

  it('does not notify authors about their own comments', async () => {
    const { owner, post } = await publishedPost()
    await comment(owner.token, post.id, 'Adding a note about the data we have.')
    expect(await Notification.countDocuments({ userId: owner.user.id })).toBe(0)
  })

  it('tells the author of a comment when someone replies to it', async () => {
    const { owner, post } = await publishedPost()
    const first = await createUser()
    const second = await createUser()
    const parent = await comment(first.token, post.id, 'Which hospitals are involved?')

    await comment(second.token, post.id, 'Good question, I would like to know too.', parent.body.data.id)

    const replyNotices = await Notification.find({ userId: first.user.id })
    expect(replyNotices).toHaveLength(1)
    expect(replyNotices[0].contentKey).toBe('comment_reply')
    // The post author hears about both comments on their post.
    expect(await Notification.countDocuments({ userId: owner.user.id, type: 'new_comment' })).toBe(2)
  })

  it('sends the post author a single notice when a reply lands on their own comment', async () => {
    const { owner, post } = await publishedPost()
    const visitor = await createUser()
    const ownerComment = await comment(owner.token, post.id, 'We are looking for a signal-processing engineer.')

    await comment(visitor.token, post.id, 'I have worked on ECG denoising for five years.', ownerComment.body.data.id)

    expect(await Notification.countDocuments({ userId: owner.user.id })).toBe(1)
  })

  it('returns 404 when the post does not exist', async () => {
    const visitor = await createUser()
    const res = await comment(visitor.token, '64b7f0f0f0f0f0f0f0f0f0f0', 'Hello?')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/posts/:id/comments', () => {
  it('lists comments with the same id the client replies to and deletes by', async () => {
    const { post } = await publishedPost()
    const visitor = await createUser()
    const parent = (await comment(visitor.token, post.id, 'Which hospitals are involved?')).body.data
    const reply = (await comment(visitor.token, post.id, 'Also: is there ethics approval?', parent.id)).body.data

    const res = await api.get(`/api/posts/${post.id}/comments`).set('Authorization', `Bearer ${visitor.token}`)
    expect(res.status).toBe(200)
    const listed = res.body.data.comments
    expect(listed.map((c: { id: string }) => c.id)).toEqual([parent.id, reply.id])
    expect(listed[1].parentId).toBe(parent.id)
    expect(listed[0]).not.toHaveProperty('__v')
  })
})
