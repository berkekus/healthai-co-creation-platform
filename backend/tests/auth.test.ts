import { describe, it, expect } from 'vitest'
import { api, createUser, uniqueEmail } from './helpers'

describe('POST /api/auth/register', () => {
  it('returns 201 with user + token; isVerified is true', async () => {
    const email = uniqueEmail()
    const res = await api.post('/api/auth/register').send({
      name: 'Alice',
      email,
      password: 'password123',
      role: 'engineer',
      institution: 'Test Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.user.isVerified).toBe(true)
  })

  it('returns 409 on duplicate email', async () => {
    const { email } = await createUser()
    const res = await api.post('/api/auth/register').send({
      name: 'Duplicate',
      email,
      password: 'password123',
      role: 'engineer',
      institution: 'Test Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await api.post('/api/auth/register').send({ email: uniqueEmail() })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 chars', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Bob',
      email: uniqueEmail(),
      password: 'short',
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 200 with token on valid credentials', async () => {
    const { email, password } = await createUser()
    const res = await api.post('/api/auth/login').send({ email, password })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeTruthy()
  })

  it('returns 401 on wrong password', async () => {
    const { email } = await createUser()
    const res = await api.post('/api/auth/login').send({ email, password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('returns 401 on unknown email', async () => {
    const res = await api.post('/api/auth/login').send({ email: uniqueEmail(), password: 'password123' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 200 with user when authenticated', async () => {
    const { token, user } = await createUser()
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(user.email)
  })

  it('returns 401 without token', async () => {
    const res = await api.get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/auth/me/password', () => {
  it('returns 200 when old password is correct', async () => {
    const { token, password } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'newpassword456' })
    expect(res.status).toBe(200)
  })

  it('returns 401 when old password is wrong', async () => {
    const { token } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'wrongoldpassword', newPassword: 'newpassword456' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when new password is too short', async () => {
    const { token, password } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'short' })
    expect(res.status).toBe(400)
  })
})
