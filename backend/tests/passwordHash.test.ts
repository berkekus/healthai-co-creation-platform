import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { hashPassword, verifyPassword, runExclusive } from '../utils/passwordHash'
import { api, uniqueEmail } from './helpers'
import User from '../models/User'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('password hashing', () => {
  it('hashes new passwords at cost 10', async () => {
    const hash = await hashPassword('classroom-pass-1')

    expect(bcrypt.getRounds(hash)).toBe(10)
    expect(await verifyPassword('classroom-pass-1', hash)).toBe(true)
    expect(await verifyPassword('wrong-guess', hash)).toBe(false)
  })

  it('stores new registrations at cost 10', async () => {
    const email = uniqueEmail()
    const res = await api.post('/api/auth/register').send({
      name: 'Student', email, password: 'classroom-pass-1', role: 'engineer',
      institution: 'Test University', city: 'Ankara', country: 'Turkey',
    })
    const user = await User.findOne({ email }).select('+password')

    expect(res.status).toBe(201)
    expect(bcrypt.getRounds(user!.password)).toBe(10)
  })

  it('still accepts passwords stored at the old cost of 12', async () => {
    const legacyHash = await bcrypt.hash('registered-last-month', 12)

    expect(await verifyPassword('registered-last-month', legacyHash)).toBe(true)
  })

  it('runs one hash at a time, in arrival order', async () => {
    let running = 0
    let peak = 0
    const finished: number[] = []
    const job = (id: number) => runExclusive(async () => {
      running++
      peak = Math.max(peak, running)
      await sleep(20)
      running--
      finished.push(id)
    })

    await Promise.all([job(1), job(2), job(3)])

    expect(peak).toBe(1)
    expect(finished).toEqual([1, 2, 3])
  })

  it('answers 503 instead of making a caller wait past the limit', async () => {
    const slow = runExclusive(() => sleep(200))
    const waiting = runExclusive(async () => 'ran', 50)

    await expect(waiting).rejects.toMatchObject({ statusCode: 503 })
    await slow
    // The slot is free again once the slow job ends
    expect(await runExclusive(async () => 'next')).toBe('next')
  })
})
