import supertest from 'supertest'
import app from '../src/app'

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
  const res = await api.post('/api/auth/register').send({
    name: 'Test User',
    email,
    password,
    role: 'engineer',
    institution: 'Test University',
    city: 'Istanbul',
    country: 'Turkey',
    ...overrides,
  })
  if (res.status !== 201) throw new Error(`createUser failed: ${JSON.stringify(res.body)}`)
  return { user: res.body.data.user, token: res.body.data.token, email, password }
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
