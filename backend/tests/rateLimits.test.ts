import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { api, createPost, futureDate, uniqueEmail } from './helpers'
import User from '../models/User'
import Post from '../models/Post'

// Limiters are skipped under NODE_ENV=test and unless RATE_LIMIT_ENABLED=true,
// so switch them on for this file.
// supertest sends every request from 127.0.0.1 — the same situation as a class
// on campus Wi-Fi, where every student reaches the API from one public IP.
const previousRateLimitFlag = process.env.RATE_LIMIT_ENABLED
beforeAll(() => {
  process.env.NODE_ENV = 'development'
  process.env.RATE_LIMIT_ENABLED = 'true'
})
afterAll(() => {
  process.env.NODE_ENV = 'test'
  if (previousRateLimitFlag === undefined) delete process.env.RATE_LIMIT_ENABLED
  else process.env.RATE_LIMIT_ENABLED = previousRateLimitFlag
})

const PASSWORD = 'classroom-pass-1'
let passwordHash: string
beforeAll(async () => { passwordHash = await bcrypt.hash(PASSWORD, 4) })

/** A verified account written straight to the DB, so setup spends no rate-limit budget. */
async function student(role: 'engineer' | 'healthcare_professional' = 'engineer') {
  const email = uniqueEmail()
  const user = await User.create({
    name: 'Student', email, password: passwordHash, role,
    institution: 'Test University', city: 'Ankara', country: 'Turkey', isVerified: true,
  })
  const token = jwt.sign(
    { id: user.id, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  )
  return { id: user.id as string, email, token }
}

describe('rate limits for a class sharing one IP', () => {
  it('lets 60 students sign in from the same network', async () => {
    const students = await Promise.all(Array.from({ length: 60 }, () => student()))

    const statuses: number[] = []
    for (const { email } of students) {
      statuses.push((await api.post('/api/auth/login').send({ email, password: PASSWORD })).status)
    }

    expect(statuses.filter(s => s !== 200)).toEqual([])
  })

  it('still stops password guessing on one account', async () => {
    const { email } = await student()

    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      statuses.push((await api.post('/api/auth/login').send({ email, password: 'wrong-guess' })).status)
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401))
    expect(statuses[10]).toBe(429)
  })

  it('lets 25 students register from the same network', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 25; i++) {
      const res = await api.post('/api/auth/register').send({
        name: `Student ${i}`, email: uniqueEmail(), password: PASSWORD, role: 'engineer',
        institution: 'Test University', city: 'Ankara', country: 'Turkey',
      })
      statuses.push(res.status)
    }

    expect(statuses.filter(s => s !== 201)).toEqual([])
  })

  it('caps reset mails per address, not per network', async () => {
    const target = await student()
    const neighbour = await student()

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      statuses.push((await api.post('/api/auth/forgot-password').send({ email: target.email })).status)
    }
    const neighbourStatus = (await api.post('/api/auth/forgot-password').send({ email: neighbour.email })).status

    expect(statuses.slice(0, 5)).toEqual(Array(5).fill(200))
    expect(statuses[5]).toBe(429)
    expect(neighbourStatus).toBe(200)
  })

  it('gives each signed-in student their own meeting-request budget', async () => {
    const owner = await student('healthcare_professional')
    const posts = []
    for (let i = 0; i < 11; i++) posts.push(await createPost(owner.token, { title: `Post ${i}` }))
    await Post.updateMany({}, { $set: { status: 'active' } })
    const [alice, bob] = await Promise.all([student(), student()])

    const request = (token: string, postId: string) => api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId, message: 'I would like to discuss this project.', ndaAccepted: true,
        proposedSlots: [{ date: futureDate(3), time: '14:00' }],
      })

    const aliceStatuses: number[] = []
    for (const post of posts.slice(0, 10)) aliceStatuses.push((await request(alice.token, post.id)).status)
    const bobStatus = (await request(bob.token, posts[10].id)).status

    expect(aliceStatuses).toEqual(Array(10).fill(201))
    expect(bobStatus).toBe(201)
  })
})
