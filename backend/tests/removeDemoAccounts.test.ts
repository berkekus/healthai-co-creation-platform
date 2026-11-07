import { describe, expect, it } from 'vitest'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import Post from '../models/Post'
import { api, createPost, createUser, uniqueEmail } from './helpers'
import { DEMO_PASSWORD, removeDemoAccounts } from '../services/demoAccounts'

async function demoUser(role: 'engineer' | 'admin' = 'engineer') {
  return User.create({
    name: 'Demo Person', email: uniqueEmail(), password: await bcrypt.hash(DEMO_PASSWORD, 4), role,
    institution: 'Demo Uni', city: 'Ankara', country: 'Türkiye', isVerified: true,
  })
}

describe('remove-demo-accounts script', () => {
  it('lists accounts with the public demo password and changes nothing in a dry run', async () => {
    const demo = await demoUser()
    const real = await createUser()

    const { accounts, report } = await removeDemoAccounts(false)

    expect(accounts.map(a => a.email)).toContain(demo.email)
    expect(accounts.map(a => a.email)).not.toContain(real.email.toLowerCase())
    expect(report.deleted).toEqual([])
    expect(await User.exists({ _id: demo._id })).not.toBeNull()
  })

  it('deletes demo accounts with their posts, and never an admin', async () => {
    const demo = await demoUser()
    const admin = await demoUser('admin')
    const login = await api.post('/api/auth/login').send({ email: demo.email, password: DEMO_PASSWORD })
    const post = await createPost(login.body.data.token)

    const { report } = await removeDemoAccounts(true)

    expect(report.deleted).toContain(demo.email)
    expect(report.skippedAdmins).toContain(admin.email)
    expect(await User.exists({ _id: demo._id })).toBeNull()
    expect(await Post.findById(post.id ?? post._id)).toBeNull()
    expect(await User.exists({ _id: admin._id })).not.toBeNull()
  })
})
