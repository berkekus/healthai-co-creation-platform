import supertest from 'supertest'
import app from '../src/app'
import User from '../models/User'

export const api = supertest(app)

let _counter = 0
export function uniqueEmail() {
  return `user${++_counter}-${Date.now()}@test.edu`
}

export interface CreatedUser {
  user: { id: string; name: string; email: string; role: string; isVerified: boolean }
  token: string
  email: string
  password: string
}

export async function createUser(overrides: Record<string, unknown> = {}): Promise<CreatedUser> {
  const email = (overrides.email as string) ?? uniqueEmail()
  const password = (overrides.password as string) ?? 'password123'
  const regRes = await api.post('/api/auth/register').send({
    name: 'Test User',
    email,
    password,
    role: 'engineer',
    institution: 'Test University',
    city: 'Istanbul',
    country: 'Turkey',
    ...overrides,
  })
  if (regRes.status !== 201) throw new Error(`createUser register failed: ${JSON.stringify(regRes.body)}`)

  // Bypass email verification in tests by flipping the flag directly
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { isVerified: true }, $unset: { verifyToken: 1, verifyTokenExpires: 1 } }
  )

  const loginRes = await api.post('/api/auth/login').send({ email, password })
  if (loginRes.status !== 200) throw new Error(`createUser login failed: ${JSON.stringify(loginRes.body)}`)

  return { user: loginRes.body.data.user, token: loginRes.body.data.token, email, password }
}

export async function createPost(token: string, overrides: Record<string, unknown> = {}) {
  const res = await api
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Post',
      domain: 'cardiology',
      expertiseRequired: 'Machine Learning',
      description: 'A test post for integration tests.',
      projectStage: 'idea',
      collaborationType: 'research_partner',
      confidentiality: 'public_pitch',
      city: 'Istanbul',
      country: 'Turkey',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    })
  if (res.status !== 201) throw new Error(`createPost failed: ${JSON.stringify(res.body)}`)
  return res.body.data
}
