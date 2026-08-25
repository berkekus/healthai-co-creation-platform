import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { api, createPost, createUser, uniqueEmail } from './helpers'
import User from '../models/User'
import Meeting from '../models/Meeting'
import Post from '../models/Post'

describe('POST /api/auth/register', () => {
  it('returns 201 with user; requiresVerification true; no token issued', async () => {
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
    expect(res.body.data.token).toBeUndefined()
    expect(res.body.data.requiresVerification).toBe(true)
    expect(res.body.data.user.isVerified).toBe(false)
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

  const registerWith = (email: string) => api.post('/api/auth/register').send({
    name: 'Institutional User',
    email,
    password: 'password123',
    role: 'engineer',
    institution: 'Test Uni',
    city: 'Istanbul',
    country: 'Turkey',
  })

  it.each(['gov', 'gov.uk', 'edu', 'edu.tr'])(
    'accepts an institutional .%s address',
    async (suffix) => {
      const res = await registerWith(`inst-${Date.now()}-${suffix.replace('.', '')}@agency.${suffix}`)
      expect(res.status).toBe(201)
    },
  )

  it('returns 400 for a personal email provider', async () => {
    const res = await registerWith(`personal-${Date.now()}@gmail.com`)
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('.edu or .gov')
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

  it('returns 400 when old password is wrong', async () => {
    const { token } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'wrongoldpassword', newPassword: 'newpassword456' })
    expect(res.status).toBe(400)
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

describe('POST /api/auth/login (unverified)', () => {
  it('returns 403 when account email is not verified', async () => {
    const email = uniqueEmail()
    const password = 'password123'
    await api.post('/api/auth/register').send({
      name: 'Unverified',
      email,
      password,
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    // Skip verification flag flip — try to login while still unverified
    const res = await api.post('/api/auth/login').send({ email, password })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/auth/verify-email', () => {
  it('verifies the user with a valid token and returns a JWT', async () => {
    const email = uniqueEmail()
    await api.post('/api/auth/register').send({
      name: 'Verifier',
      email,
      password: 'password123',
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })

    // DB stores SHA256(rawToken); inject a known raw token so the test can send it
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { verifyToken: hashedToken, verifyTokenExpires: new Date(Date.now() + 86400_000) }
    )

    const res = await api.post('/api/auth/verify-email').send({ token: rawToken })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.user.isVerified).toBe(true)
  })

  it('returns 400 on invalid token', async () => {
    const res = await api.post('/api/auth/verify-email').send({ token: 'definitely-not-real' })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/auth/me', () => {
  it('deletes the account when password is correct', async () => {
    const { token, password, email } = await createUser()
    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password })
    expect(res.status).toBe(200)

    const gone = await User.findOne({ email: email.toLowerCase() })
    expect(gone).toBeNull()
  })

  it('deletes owned data and safely anonymizes an active meeting', async () => {
    const account = await createUser()
    const owner = await createUser({ role: 'healthcare_professional' })
    const ownerPost = await createPost(owner.token)
    const ownedPost = await createPost(account.token)

    await api
      .post(`/api/posts/${ownerPost.id}/publish`)
      .set('Authorization', `Bearer ${owner.token}`)

    const meetingRes = await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${account.token}`)
      .send({
        postId: ownerPost.id,
        message: 'I am interested in collaborating on this health AI project.',
        ndaAccepted: true,
        proposedSlots: [
          { date: '2026-09-01', time: '10:00' },
          { date: '2026-09-02', time: '11:00' },
          { date: '2026-09-03', time: '14:00' },
        ],
      })
    expect(meetingRes.status).toBe(201)

    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${account.token}`)
      .send({ password: account.password })
    expect(res.status).toBe(200)

    expect(await User.exists({ email: account.email.toLowerCase() })).toBeNull()
    expect(await Post.findById(ownedPost.id)).toBeNull()

    const retainedMeeting = await Meeting.findById(meetingRes.body.data.id)
    expect(retainedMeeting?.status).toBe('cancelled')
    expect(retainedMeeting?.requesterName).toBe('Deleted user')
    expect(retainedMeeting?.requesterEmail).toBe('')
  })

  it('returns 400 with wrong password and keeps the account', async () => {
    const { token, email } = await createUser()
    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrongpassword' })
    expect(res.status).toBe(400)
    expect(await User.exists({ email: email.toLowerCase() })).not.toBeNull()
  })

  it('returns 400 when password is missing', async () => {
    const { token } = await createUser()
    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/forgot-password + reset-password', () => {
  it('silently succeeds for unknown email', async () => {
    const res = await api.post('/api/auth/forgot-password').send({ email: 'nobody@nowhere.com' })
    expect(res.status).toBe(200)
  })

  it('resets password with a valid token', async () => {
    const { email, password } = await createUser()

    // Trigger forgot-password (silently sends email)
    await api.post('/api/auth/forgot-password').send({ email })

    // Inject a known raw token directly into DB (same pattern as verifyEmail test)
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetToken: hashedToken, resetTokenExpires: new Date(Date.now() + 3_600_000) }
    )

    const newPassword = 'NewPassword99!'
    const resetRes = await api.post('/api/auth/reset-password').send({ token: rawToken, newPassword })
    expect(resetRes.status).toBe(200)

    // Old password no longer works
    const oldLoginRes = await api.post('/api/auth/login').send({ email, password })
    expect(oldLoginRes.status).toBe(401)

    // New password works
    const newLoginRes = await api.post('/api/auth/login').send({ email, password: newPassword })
    expect(newLoginRes.status).toBe(200)
  })

  it('returns 400 on invalid reset token', async () => {
    const res = await api.post('/api/auth/reset-password').send({ token: 'fakefake', newPassword: 'NewPass123!' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when new password is too short', async () => {
    const res = await api.post('/api/auth/reset-password').send({ token: 'sometoken', newPassword: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('OAuth account linking', () => {
  const withGithubConfigured = async (fn: () => Promise<void>) => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret'
    try { await fn() } finally {
      delete process.env.GITHUB_CLIENT_ID
      delete process.env.GITHUB_CLIENT_SECRET
    }
  }

  it('requires authentication to start a link', async () => {
    const res = await api.get('/api/auth/github/link-url')
    expect(res.status).toBe(401)
  })

  it('reports the provider as unavailable when it has no credentials', async () => {
    const { token } = await createUser()
    const res = await api.get('/api/auth/github/link-url').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(503)
  })

  it('sends the browser back to the profile instead of erroring when unconfigured', async () => {
    const res = await api.get('/api/auth/github')
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('oauth_error=not_configured')
  })

  it('issues a start url whose state token names the caller and the provider', async () => {
    await withGithubConfigured(async () => {
      const { token, user } = await createUser()
      const res = await api.get('/api/auth/github/link-url').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)

      const url = new URL(res.body.data.url as string)
      expect(url.pathname).toBe('/api/auth/github')

      const state = url.searchParams.get('state')
      expect(state).toBeTruthy()

      const payload = jwt.verify(state as string, process.env.JWT_SECRET as string) as {
        uid: string; provider: string; purpose: string
      }
      expect(payload.purpose).toBe('oauth-link')
      expect(payload.provider).toBe('github')
      expect(payload.uid).toBe(user.id)
    })
  })

  it('disconnects a linked provider', async () => {
    const { token, user } = await createUser()
    await User.findByIdAndUpdate(user.id, { $set: { githubId: 'gh-123', githubUsername: 'octocat' } })

    const res = await api.delete('/api/auth/github/link').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)

    const after = await User.findById(user.id).lean()
    expect(after?.githubId).toBeUndefined()
    expect(after?.githubUsername).toBeUndefined()
  })

  it('keeps the callback from minting an account when the state is missing', async () => {
    const before = await User.countDocuments()
    const res = await api.get('/api/auth/github/callback?code=irrelevant')
    // Unconfigured provider: passport has no strategy, so this must not 2xx.
    expect(res.status).not.toBe(200)
    expect(await User.countDocuments()).toBe(before)
  })
})
