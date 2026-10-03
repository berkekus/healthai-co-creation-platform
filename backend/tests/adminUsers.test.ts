import { beforeEach, describe, it, expect } from 'vitest'
import { api, createUser } from './helpers'

let adminToken: string

beforeEach(async () => {
  adminToken = (await createUser({ role: 'admin' })).token
  await createUser({ name: 'Ayşe Demir', institution: 'Hacettepe University' })
  await createUser({ name: 'Mert Kaya', institution: 'METU' })
})

const getUsers = (query: string) => api.get(`/api/auth/users?${query}`).set('Authorization', `Bearer ${adminToken}`)
const names = (res: { body: { data: { users: { name: string }[] } } }) => res.body.data.users.map(u => u.name).sort()

describe('GET /api/auth/users — admin user list', () => {
  it('leaves admins out of the count and the page when asked to', async () => {
    const res = await getUsers('excludeAdmins=true')
    expect(res.status).toBe(200)
    expect(res.body.data.total).toBe(2)
    expect(res.body.data.users.every((u: { role: string }) => u.role !== 'admin')).toBe(true)
  })

  it('finds users by institution as well as by name or email', async () => {
    const res = await getUsers('excludeAdmins=true&search=hacettepe')
    expect(names(res)).toEqual(['Ayşe Demir'])
  })

  it('treats regex characters in the search literally', async () => {
    const all = await getUsers(`excludeAdmins=true&search=${encodeURIComponent('.*')}`)
    const broken = await getUsers(`excludeAdmins=true&search=${encodeURIComponent('(')}`)
    expect(all.status).toBe(200)
    expect(all.body.data.users).toEqual([])
    expect(broken.status).toBe(200)
  })
})
