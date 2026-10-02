import { beforeEach, describe, it, expect } from 'vitest'
import { Types } from 'mongoose'
import { api, createUser } from './helpers'
import Log from '../models/Log'

// Signing in the admin writes its own log entries (asynchronously), so every query is scoped to these fixtures.
const FIXTURE_USER = new Types.ObjectId().toString()
let adminToken: string

beforeEach(async () => {
  adminToken = (await createUser({ role: 'admin' })).token
  await Log.create([
    { userId: FIXTURE_USER, userEmail: 'a@test.edu', role: 'engineer', action: 'login', result: 'success' },
    { userId: FIXTURE_USER, userEmail: 'b@test.edu', role: 'engineer', action: 'login_failed', result: 'failure' },
    { userId: FIXTURE_USER, userEmail: 'c@test.edu', role: 'healthcare_professional', action: 'post_create', result: 'success' },
  ])
})

const getLogs = (query: string) =>
  api.get(`/api/logs?userId=${FIXTURE_USER}&${query}`).set('Authorization', `Bearer ${adminToken}`)
const actions = (res: { body: { data: { logs: { action: string }[] } } }) => res.body.data.logs.map(l => l.action).sort()

describe('GET /api/logs — action filter', () => {
  it('still finds actions by part of their name', async () => {
    const res = await getLogs('action=login')
    expect(res.status).toBe(200)
    expect(actions(res)).toEqual(['login', 'login_failed'])
  })

  it('treats regex characters literally instead of running them', async () => {
    // "(a+)+$" is a catastrophic-backtracking pattern; ".*" would match every action if it ran as a regex.
    const slow = await getLogs(`action=${encodeURIComponent('(a+)+$')}`)
    const all = await getLogs(`action=${encodeURIComponent('.*')}`)
    expect(slow.status).toBe(200)
    expect(all.status).toBe(200)
    expect(slow.body.data.logs).toEqual([])
    expect(all.body.data.logs).toEqual([])
  })

  it('does not fail on a pattern that is not a valid regex', async () => {
    const res = await getLogs(`action=${encodeURIComponent('(')}`)
    expect(res.status).toBe(200)
    expect(res.body.data.logs).toEqual([])
  })
})

describe('GET /api/logs — query parameters', () => {
  it('ignores query operators smuggled in as objects', async () => {
    // qs turns result[$ne]=success into { $ne: 'success' }; it must not reach MongoDB as an operator.
    const res = await getLogs('result[$ne]=success')
    expect(res.status).toBe(200)
    expect(res.body.data.logs).toHaveLength(3)
  })

  it('filters by a valid result value', async () => {
    const res = await getLogs('result=failure')
    expect(res.status).toBe(200)
    expect(actions(res)).toEqual(['login_failed'])
  })

  it('falls back to safe paging for nonsense page and limit values', async () => {
    const res = await getLogs('page=-1&limit=abc')
    expect(res.status).toBe(200)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.logs).toHaveLength(3)
  })
})
